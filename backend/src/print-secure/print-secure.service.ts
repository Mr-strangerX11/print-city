import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';

import { PrismaService } from '../prisma/prisma.service';
import { SecureStorageService } from '../storage/secure-storage.service';
import { CreatePrintJobDto } from './dto/create-print-job.dto';
import { DesignPrintFormat } from '@prisma/client';

// ─── Print format definitions ─────────────────────────────────────────────────
// All measurements in mm. Bleed adds to each side.

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
const POINTS_PER_INCH = 72; // PDF uses 72pt/inch
const MM_TO_PT = MM_TO_INCH * POINTS_PER_INCH; // 1mm = 2.8346pt

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
    private prisma: PrismaService,
    private storage: SecureStorageService,
    private config: ConfigService,
  ) {}

  // ─── Create print job ───────────────────────────────────────────────────────

  async createPrintJob(adminId: string, dto: CreatePrintJobDto) {
    const design = await this.prisma.design.findUnique({ where: { id: dto.designId } });
    if (!design) throw new NotFoundException('Design not found');
    if (design.status !== 'APPROVED') {
      throw new BadRequestException('Only approved designs can be printed');
    }

    const job = await this.prisma.designPrintJob.create({
      data: {
        designId: dto.designId,
        adminId,
        format: dto.format,
        colorMode: dto.colorMode ?? 'RGB',
        copies: dto.copies ?? 1,
        dpi: dto.dpi ?? 300,
        bleed: dto.bleed ?? FORMATS[dto.format].defaultBleedMm,
        notes: dto.notes,
        status: 'QUEUED',
      },
      select: { id: true, status: true, format: true, copies: true, createdAt: true },
    });

    // Kick off async processing — don't await (returns immediately)
    this.processJob(job.id).catch((err) => {
      this.logger.error(`Print job ${job.id} failed: ${err.message}`);
      this.prisma.designPrintJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: err.message },
      });
    });

    return job;
  }

  // ─── Get print job status ───────────────────────────────────────────────────

  async getJobStatus(jobId: string, adminId: string) {
    const job = await this.prisma.designPrintJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        format: true,
        dpi: true,
        colorMode: true,
        copies: true,
        bleed: true,
        notes: true,
        startedAt: true,
        completedAt: true,
        error: true,
        printToken: true,
        printTokenExpiresAt: true,
        adminId: true,
        createdAt: true,
        design: { select: { id: true, title: true } },
      },
    });

    if (!job) throw new NotFoundException('Print job not found');
    if (job.adminId !== adminId) throw new ForbiddenException('Access denied');

    // Strip print token from response if expired
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
    const job = await this.prisma.designPrintJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Print job not found');
    if (job.adminId !== adminId) throw new ForbiddenException('Access denied');
    if (job.status !== 'COMPLETED') throw new BadRequestException('Print job not completed yet');

    const printToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

    await this.prisma.designPrintJob.update({
      where: { id: jobId },
      data: { printToken, printTokenExpiresAt: expiresAt },
    });

    return { printToken, expiresAt };
  }

  // ─── Stream PDF directly to print dialog (no download) ─────────────────────

  async streamPrintPdf(printToken: string): Promise<{
    pdfBuffer: Buffer;
    jobId: string;
    copies: number;
  }> {
    const job = await this.prisma.designPrintJob.findUnique({
      where: { printToken },
      include: { design: { select: { storageKey: true, title: true } } },
    });

    if (!job) throw new ForbiddenException('Invalid print token');
    if (!job.printTokenExpiresAt || job.printTokenExpiresAt < new Date()) {
      throw new ForbiddenException('Print token expired');
    }

    // Invalidate token immediately (one-time use)
    await this.prisma.designPrintJob.update({
      where: { id: job.id },
      data: { printToken: null, printTokenExpiresAt: null },
    });

    // Fetch original from private storage (backend only)
    const originalBuffer = await this.storage.fetchFileBuffer(job.design.storageKey);

    // Process to print-ready PDF
    const pdfBuffer = await this.buildPrintPdf(originalBuffer, job);

    return { pdfBuffer, jobId: job.id, copies: job.copies };
  }

  // ─── Internal: Process job (runs async) ────────────────────────────────────

  private async processJob(jobId: string): Promise<void> {
    await this.prisma.designPrintJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    const job = await this.prisma.designPrintJob.findUnique({
      where: { id: jobId },
      include: { design: { select: { storageKey: true, fileType: true } } },
    });

    // We don't store the PDF — just validate it can be generated
    // The actual generation happens at print time via streamPrintPdf
    const originalBuffer = await this.storage.fetchFileBuffer(job!.design.storageKey);
    await this.buildPrintPdf(originalBuffer, job!); // validate no errors

    await this.prisma.designPrintJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    this.logger.log(`Print job ${jobId} processed successfully`);
  }

  // ─── Internal: Build print-ready PDF ───────────────────────────────────────

  private async buildPrintPdf(imageBuffer: Buffer, job: any): Promise<Buffer> {
    const fmt = FORMATS[job.format as DesignPrintFormat];
    const dpi: number = job.dpi ?? 300;
    const bleedMm: number = job.bleed ?? fmt.defaultBleedMm;

    const totalWidthMm = fmt.widthMm + bleedMm * 2;
    const totalHeightMm = fmt.heightMm + bleedMm * 2;

    // Pixel dimensions at target DPI (with bleed)
    const pxWidth = mmToPx(totalWidthMm, dpi);
    const pxHeight = mmToPx(totalHeightMm, dpi);

    // Resize image to print dimensions at DPI
    let processed = await sharp(imageBuffer)
      .resize(pxWidth, pxHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: false,
      })
      .withMetadata({ density: dpi }) // embed DPI metadata
      .png({ compressionLevel: 1 })    // lossless for print quality
      .toBuffer();

    // CMYK conversion: Sharp doesn't natively support CMYK output,
    // but we can tag the intent. Real CMYK requires ICC profile embedding.
    // For production, integrate with LittleCMS or Ghostscript.
    if (job.colorMode === 'CMYK') {
      this.logger.warn(
        `Job ${job.id}: CMYK intent set. Embed ICC profile for full CMYK workflow.`,
      );
    }

    // Build PDF with exact page size (including bleed)
    const pdfBuffer = await this.buildPdf(processed, {
      pageWidthPt: mmToPt(totalWidthMm),
      pageHeightPt: mmToPt(totalHeightMm),
      bleedPt: mmToPt(bleedMm),
      jobId: job.id,
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

      // Place image full-page (covers bleed area)
      doc.image(imageBuffer, 0, 0, {
        width: opts.pageWidthPt,
        height: opts.pageHeightPt,
        cover: [opts.pageWidthPt, opts.pageHeightPt],
      });

      // Draw crop marks if bleed > 0
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
    const markLen = mmToPt(5); // 5mm crop mark length
    const gap = mmToPt(1);     // 1mm gap from bleed edge

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

      // Horizontal mark
      const hx1 = leftX ? x - gap - markLen : x + gap;
      const hx2 = leftX ? x - gap : x + gap + markLen;
      doc.moveTo(hx1, y).lineTo(hx2, y).stroke();

      // Vertical mark
      const vy1 = topY ? y - gap - markLen : y + gap;
      const vy2 = topY ? y - gap : y + gap + markLen;
      doc.moveTo(x, vy1).lineTo(x, vy2).stroke();
    }

    // Center registration marks (horizontal and vertical lines)
    const cx = pageW / 2;
    const cy = pageH / 2;
    const regR = mmToPt(2.5);

    doc.circle(cx, cy, regR).stroke();
    doc.moveTo(cx - regR * 2, cy).lineTo(cx + regR * 2, cy).stroke();
    doc.moveTo(cx, cy - regR * 2).lineTo(cx, cy + regR * 2).stroke();

    doc.restore();
  }
}
