import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';

import { SecureStorageService } from '../storage/secure-storage.service';
import { CreatePrintJobDto } from './dto/create-print-job.dto';
import { DesignPrintFormat } from '../common/enums';
import { DesignPrintJob, DesignPrintJobDocument } from '../designs/schemas/design-print-job.schema';
import { Design, DesignDocument } from '../designs/schemas/design.schema';

const FORMATS: Record<
  DesignPrintFormat,
  { widthMm: number; heightMm: number; defaultBleedMm: number; label: string }
> = {
  A4: { widthMm: 210, heightMm: 297, defaultBleedMm: 3, label: 'A4 (210×297mm)' },
  A3: { widthMm: 297, heightMm: 420, defaultBleedMm: 3, label: 'A3 (297×420mm)' },
  TSHIRT: { widthMm: 280, heightMm: 330, defaultBleedMm: 0, label: 'T-Shirt (280×330mm)' },
  HOODIE: { widthMm: 300, heightMm: 380, defaultBleedMm: 0, label: 'Hoodie (300×380mm)' },
  MUG: { widthMm: 237, heightMm: 93, defaultBleedMm: 2, label: 'Mug Wrap (237×93mm)' },
  CUSTOM: { widthMm: 210, heightMm: 297, defaultBleedMm: 3, label: 'Custom' },
};

const MM_TO_INCH = 1 / 25.4;
const POINTS_PER_INCH = 72;
const MM_TO_PT = MM_TO_INCH * POINTS_PER_INCH;

function mmToPx(mm: number, dpi: number): number {
  return Math.round(mm * MM_TO_INCH * dpi);
}

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

@Injectable()
export class PrintSecureService {
  private readonly logger = new Logger(PrintSecureService.name);

  constructor(
    @InjectModel(DesignPrintJob.name) private printJobModel: Model<DesignPrintJobDocument>,
    @InjectModel(Design.name) private designModel: Model<DesignDocument>,
    private storage: SecureStorageService,
    private config: ConfigService,
  ) {}

  // ─── Create print job ───────────────────────────────────────────────────────

  async createPrintJob(adminId: string, dto: CreatePrintJobDto) {
    const design = await this.designModel.findById(dto.designId).lean().exec();
    if (!design) throw new NotFoundException('Design not found');
    if (design.status !== 'APPROVED') {
      throw new BadRequestException('Only approved designs can be printed');
    }

    const job = await this.printJobModel.create({
      designId: new Types.ObjectId(dto.designId),
      adminId: new Types.ObjectId(adminId),
      format: dto.format,
      colorMode: dto.colorMode ?? 'RGB',
      copies: dto.copies ?? 1,
      dpi: dto.dpi ?? 300,
      bleed: dto.bleed ?? FORMATS[dto.format].defaultBleedMm,
      notes: dto.notes,
      status: 'QUEUED',
    });

    const jobObj = job.toObject();

    // Kick off async processing
    this.processJob(job._id.toString()).catch((err) => {
      this.logger.error(`Print job ${job._id} failed: ${err.message}`);
      this.printJobModel.findByIdAndUpdate(job._id, { status: 'FAILED', error: err.message });
    });

    return {
      id: jobObj._id,
      status: jobObj.status,
      format: jobObj.format,
      copies: jobObj.copies,
      createdAt: (jobObj as any).createdAt,
    };
  }

  // ─── Get print job status ───────────────────────────────────────────────────

  async getJobStatus(jobId: string, adminId: string): Promise<any> {
    const job = await this.printJobModel
      .findById(jobId)
      .populate('designId', 'title')
      .lean()
      .exec();

    if (!job) throw new NotFoundException('Print job not found');
    if (job.adminId.toString() !== adminId) throw new ForbiddenException('Access denied');

    const tokenValid =
      job.printToken &&
      job.printTokenExpiresAt &&
      job.printTokenExpiresAt > new Date();

    return {
      ...job,
      printToken: tokenValid ? job.printToken : null,
      printTokenExpiresAt: tokenValid ? job.printTokenExpiresAt : null,
    };
  }

  // ─── Issue one-time print render token ─────────────────────────────────────

  async issuePrintToken(jobId: string, adminId: string): Promise<{ printToken: string; expiresAt: Date }> {
    const job = await this.printJobModel.findById(jobId).lean().exec();
    if (!job) throw new NotFoundException('Print job not found');
    if (job.adminId.toString() !== adminId) throw new ForbiddenException('Access denied');
    if (job.status !== 'COMPLETED') throw new BadRequestException('Print job not completed yet');

    const printToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 1000);

    await this.printJobModel.findByIdAndUpdate(jobId, { printToken, printTokenExpiresAt: expiresAt });

    return { printToken, expiresAt };
  }

  // ─── Stream PDF directly to print dialog ────────────────────────────────────

  async streamPrintPdf(printToken: string): Promise<{ pdfBuffer: Buffer; jobId: string; copies: number }> {
    const job = await this.printJobModel
      .findOne({ printToken })
      .populate('designId', 'storageKey title')
      .lean()
      .exec();

    if (!job) throw new ForbiddenException('Invalid print token');
    if (!job.printTokenExpiresAt || job.printTokenExpiresAt < new Date()) {
      throw new ForbiddenException('Print token expired');
    }

    await this.printJobModel.findByIdAndUpdate(job._id, {
      printToken: null,
      printTokenExpiresAt: null,
    });

    const design = job.designId as any;
    const originalBuffer = await this.storage.fetchFileBuffer(design.storageKey);
    const pdfBuffer = await this.buildPrintPdf(originalBuffer, job);

    return { pdfBuffer, jobId: job._id.toString(), copies: job.copies };
  }

  // ─── Internal: Process job ──────────────────────────────────────────────────

  private async processJob(jobId: string): Promise<void> {
    await this.printJobModel.findByIdAndUpdate(jobId, { status: 'PROCESSING', startedAt: new Date() });

    const job = await this.printJobModel
      .findById(jobId)
      .populate('designId', 'storageKey fileType')
      .lean()
      .exec();

    const design = (job as any).designId as any;
    const originalBuffer = await this.storage.fetchFileBuffer(design.storageKey);
    await this.buildPrintPdf(originalBuffer, job!);

    await this.printJobModel.findByIdAndUpdate(jobId, { status: 'COMPLETED', completedAt: new Date() });

    this.logger.log(`Print job ${jobId} processed successfully`);
  }

  // ─── Internal: Build print-ready PDF ───────────────────────────────────────

  private async buildPrintPdf(imageBuffer: Buffer, job: any): Promise<Buffer> {
    const fmt = FORMATS[job.format as DesignPrintFormat];
    const dpi: number = job.dpi ?? 300;
    const bleedMm: number = job.bleed ?? fmt.defaultBleedMm;

    const totalWidthMm = fmt.widthMm + bleedMm * 2;
    const totalHeightMm = fmt.heightMm + bleedMm * 2;

    const pxWidth = mmToPx(totalWidthMm, dpi);
    const pxHeight = mmToPx(totalHeightMm, dpi);

    const processed = await sharp(imageBuffer)
      .resize(pxWidth, pxHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false,
      })
      .withMetadata({ density: dpi })
      .png({ compressionLevel: 1 })
      .toBuffer();

    if (job.colorMode === 'CMYK') {
      this.logger.warn(`Job ${job._id ?? job.id}: CMYK intent set. Embed ICC profile for full CMYK workflow.`);
    }

    const pdfBuffer = await this.buildPdf(processed, {
      pageWidthPt: mmToPt(totalWidthMm),
      pageHeightPt: mmToPt(totalHeightMm),
      bleedPt: mmToPt(bleedMm),
      jobId: job._id?.toString() ?? job.id,
      format: fmt.label,
      dpi,
      colorMode: job.colorMode,
    });

    return pdfBuffer;
  }

  private buildPdf(
    imageBuffer: Buffer,
    opts: {
      pageWidthPt: number;
      pageHeightPt: number;
      bleedPt: number;
      jobId: string;
      format: string;
      dpi: number;
      colorMode: string;
    },
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const doc = new PDFDocument({
        size: [opts.pageWidthPt, opts.pageHeightPt],
        margin: 0,
        info: {
          Title: `Print City — Job ${opts.jobId}`,
          Author: 'Print City Platform',
          Creator: 'Print City Print Engine',
          Keywords: `${opts.format}, ${opts.dpi}dpi, ${opts.colorMode}`,
          CreationDate: new Date(),
        },
        autoFirstPage: true,
        compress: true,
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.image(imageBuffer, 0, 0, {
        width: opts.pageWidthPt,
        height: opts.pageHeightPt,
        cover: [opts.pageWidthPt, opts.pageHeightPt],
      });

      if (opts.bleedPt > 0) {
        this.drawCropMarks(doc, opts.pageWidthPt, opts.pageHeightPt, opts.bleedPt);
      }

      doc.end();
    });
  }

  private drawCropMarks(
    doc: PDFKit.PDFDocument,
    pageW: number,
    pageH: number,
    bleed: number,
  ): void {
    const markLen = mmToPt(5);
    const gap = mmToPt(1);

    doc.save();
    doc.lineWidth(0.25).strokeColor('#000000').opacity(0.9);

    const corners = [
      { x: bleed, y: bleed },
      { x: pageW - bleed, y: bleed },
      { x: bleed, y: pageH - bleed },
      { x: pageW - bleed, y: pageH - bleed },
    ];

    for (const { x, y } of corners) {
      const leftX = x === bleed;
      const topY = y === bleed;

      const hx1 = leftX ? x - gap - markLen : x + gap;
      const hx2 = leftX ? x - gap : x + gap + markLen;
      doc.moveTo(hx1, y).lineTo(hx2, y).stroke();

      const vy1 = topY ? y - gap - markLen : y + gap;
      const vy2 = topY ? y - gap : y + gap + markLen;
      doc.moveTo(x, vy1).lineTo(x, vy2).stroke();
    }

    const cx = pageW / 2;
    const cy = pageH / 2;
    const regR = mmToPt(2.5);

    doc.circle(cx, cy, regR).stroke();
    doc.moveTo(cx - regR * 2, cy).lineTo(cx + regR * 2, cy).stroke();
    doc.moveTo(cx, cy - regR * 2).lineTo(cx, cy + regR * 2).stroke();

    doc.restore();
  }
}
