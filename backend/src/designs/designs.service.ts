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
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import sharp from 'sharp';

import { SecureStorageService } from '../storage/secure-storage.service';
import { UploadDesignDto } from './dto/upload-design.dto';
import { QueryDesignsDto } from './dto/query-designs.dto';
import { Design, DesignDocument } from './schemas/design.schema';
import { ViewToken, ViewTokenDocument } from './schemas/view-token.schema';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/pdf',
];

const MAX_FILE_SIZE_MB = 50;

function buildWatermarkSvg(width: number, height: number, text: string): Buffer {
  const tiles: string[] = [];
  const step = 180;

  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += step) {
      tiles.push(
        `<text x="${x}" y="${y}" transform="rotate(-35,${x},${y})"
          fill="rgba(255,255,255,0.18)" stroke="rgba(0,0,0,0.08)"
          stroke-width="0.4" font-size="13" font-family="Arial,sans-serif"
          font-weight="700" letter-spacing="1">${text}</text>`,
      );
    }
  }

  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      ${tiles.join('')}
    </svg>`,
  );
}

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(
    @InjectModel(Design.name) private designModel: Model<DesignDocument>,
    @InjectModel(ViewToken.name) private viewTokenModel: Model<ViewTokenDocument>,
    private storage: SecureStorageService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── VENDOR: Upload ────────────────────────────────────────────────────────

  async upload(vendorId: string, file: Express.Multer.File, dto: UploadDesignDto) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }

    let width: number | undefined;
    let height: number | undefined;
    let dpi: number | undefined;

    if (file.mimetype.startsWith('image/')) {
      const meta = await sharp(file.buffer).metadata();
      width = meta.width;
      height = meta.height;
      dpi = meta.density;
    }

    const uploaded = await this.storage.uploadPrivate(file.buffer, {
      folder: `designs/vendor-${vendorId}`,
      resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });

    const design = await this.designModel.create({
      title: dto.title,
      description: dto.description,
      tags: dto.tags ?? [],
      storageKey: uploaded.storageKey,
      storageType: 'cloudinary',
      fileType: file.mimetype,
      fileSize: file.size,
      width,
      height,
      dpi,
      vendorId: new Types.ObjectId(vendorId),
    });

    this.logger.log(`Design uploaded: ${design._id} by vendor ${vendorId}`);

    // Return without storageKey
    const { storageKey: _sk, ...safeDesign } = design.toObject() as any;
    return safeDesign;
  }

  // ─── VENDOR: List own designs ───────────────────────────────────────────────

  async getVendorDesigns(vendorId: string, query: QueryDesignsDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = { vendorId: new Types.ObjectId(vendorId) };
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [designs, total] = await Promise.all([
      this.designModel
        .find(filter, { storageKey: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.designModel.countDocuments(filter),
    ]);

    return { items: designs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── ADMIN: List all designs ────────────────────────────────────────────────

  async getAllDesigns(query: QueryDesignsDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }];
    }

    const [designs, total] = await Promise.all([
      this.designModel
        .find(filter, { storageKey: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vendorId', 'storeName')
        .lean()
        .exec(),
      this.designModel.countDocuments(filter),
    ]);

    return { items: designs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── ADMIN: Update status (approve/reject) ──────────────────────────────────

  async updateStatus(designId: string, status: 'APPROVED' | 'REJECTED') {
    const design = await this.designModel.findByIdAndUpdate(
      designId,
      { status },
      { new: true, projection: { id: 1, status: 1, updatedAt: 1 } },
    ).exec();
    if (!design) throw new NotFoundException('Design not found');
    return design;
  }

  // ─── TOKEN: Generate secure view token ─────────────────────────────────────

  async requestViewToken(
    designId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const design = await this.designModel.findById(designId).lean().exec();
    if (!design) throw new NotFoundException('Design not found');

    if (userRole === 'VENDOR' && design.vendorId.toString() !== userId) {
      throw new ForbiddenException('Access denied to this design');
    }

    const secret = this.config.get<string>('VIEW_TOKEN_SECRET')!;
    const ttl = 60;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const jti = randomBytes(16).toString('hex');

    const token = this.jwt.sign(
      { sub: userId, designId, role: userRole, jti, type: 'view' },
      { secret, expiresIn: `${ttl}s` },
    );

    await this.viewTokenModel.create({
      token,
      designId: new Types.ObjectId(designId),
      userId: new Types.ObjectId(userId),
      userRole,
      expiresAt,
      ipAddress: ip,
      userAgent,
    });

    return { token, expiresAt };
  }

  // ─── RENDER: Watermarked display image ─────────────────────────────────────

  async renderDisplayImage(
    token: string,
    userId: string,
    userRole: string,
  ): Promise<{ imageData: string; mimeType: string }> {
    const secret = this.config.get<string>('VIEW_TOKEN_SECRET')!;

    let payload: { sub: string; designId: string; role: string; jti: string; type: string };
    try {
      payload = this.jwt.verify(token, { secret }) as typeof payload;
    } catch {
      throw new ForbiddenException('Invalid or expired view token');
    }

    if (payload.type !== 'view' || payload.sub !== userId) {
      throw new ForbiddenException('Token subject mismatch');
    }

    const record = await this.viewTokenModel
      .findOne({ token })
      .populate('designId', 'storageKey fileType vendorId')
      .lean()
      .exec();

    if (!record) throw new ForbiddenException('Token not found');
    if (record.expiresAt < new Date()) throw new ForbiddenException('Token expired');
    if (record.usedAt) throw new ForbiddenException('Token already used');

    const design = record.designId as any;
    if (userRole === 'VENDOR' && design.vendorId?.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.viewTokenModel.findOneAndUpdate({ token }, { usedAt: new Date() });

    const originalBuffer = await this.storage.fetchFileBuffer(design.storageKey);
    const displayBuffer = await this.processForDisplay(originalBuffer, userId, userRole);

    return { imageData: displayBuffer.toString('base64'), mimeType: 'image/jpeg' };
  }

  private async processForDisplay(
    buffer: Buffer,
    userId: string,
    userRole: string,
  ): Promise<Buffer> {
    const resized = await sharp(buffer)
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: false })
      .jpeg({ quality: 82 })
      .toBuffer();

    const { width, height } = await sharp(resized).metadata();

    const ts = new Date().toLocaleString('en-US', { hour12: false });
    const label = `${userRole} • ${userId.slice(0, 10)}… • ${ts} • PRINT CITY CONFIDENTIAL`;

    const watermark = buildWatermarkSvg(width!, height!, label);

    return sharp(resized)
      .composite([{ input: watermark, gravity: 'northwest' }])
      .jpeg({ quality: 78 })
      .toBuffer();
  }
}
