import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service';
import { SecureStorageService } from '../storage/secure-storage.service';
import { UploadDesignDto } from './dto/upload-design.dto';
import { QueryDesignsDto } from './dto/query-designs.dto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/pdf',
];

const MAX_FILE_SIZE_MB = 50;

// Watermark tile: repeated diagonally across the display image
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
    private prisma: PrismaService,
    private storage: SecureStorageService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── VENDOR: Upload ────────────────────────────────────────────────────────

  async upload(vendorId: string, file: Express.Multer.File, dto: UploadDesignDto) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
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

    // Upload to PRIVATE storage — never public
    const uploaded = await this.storage.uploadPrivate(file.buffer, {
      folder: `designs/vendor-${vendorId}`,
      resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });

    const design = await this.prisma.design.create({
      data: {
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
        vendorId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        fileType: true,
        fileSize: true,
        width: true,
        height: true,
        dpi: true,
        status: true,
        createdAt: true,
        // storageKey intentionally excluded
      },
    });

    this.logger.log(`Design uploaded: ${design.id} by vendor ${vendorId}`);
    return design;
  }

  // ─── VENDOR: List own designs ───────────────────────────────────────────────

  async getVendorDesigns(vendorId: string, query: QueryDesignsDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { vendorId };
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.design.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          fileType: true,
          fileSize: true,
          width: true,
          height: true,
          dpi: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          // NEVER include storageKey
        },
      }),
      this.prisma.design.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── ADMIN: List all designs ────────────────────────────────────────────────

  async getAllDesigns(query: QueryDesignsDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { storeName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.design.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          fileType: true,
          fileSize: true,
          width: true,
          height: true,
          dpi: true,
          status: true,
          createdAt: true,
          vendor: { select: { id: true, storeName: true } },
          // NEVER include storageKey
        },
      }),
      this.prisma.design.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── ADMIN: Update status (approve/reject) ──────────────────────────────────

  async updateStatus(designId: string, status: 'APPROVED' | 'REJECTED') {
    const design = await this.prisma.design.findUnique({ where: { id: designId } });
    if (!design) throw new NotFoundException('Design not found');

    return this.prisma.design.update({
      where: { id: designId },
      data: { status: status as any },
      select: { id: true, status: true, updatedAt: true },
    });
  }

  // ─── TOKEN: Generate secure view token ─────────────────────────────────────

  async requestViewToken(
    designId: string,
    userId: string,
    userRole: string,
    ip: string,
    userAgent: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const design = await this.prisma.design.findUnique({ where: { id: designId } });
    if (!design) throw new NotFoundException('Design not found');

    // Vendors can only view their own designs
    if (userRole === 'VENDOR' && design.vendorId !== userId) {
      throw new ForbiddenException('Access denied to this design');
    }

    const secret = this.config.get<string>('VIEW_TOKEN_SECRET')!;
    const ttl = 60; // seconds
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const jti = randomBytes(16).toString('hex'); // unique token ID

    const token = this.jwt.sign(
      { sub: userId, designId, role: userRole, jti, type: 'view' },
      { secret, expiresIn: `${ttl}s` },
    );

    await this.prisma.viewToken.create({
      data: { token, designId, userId, userRole, expiresAt, ipAddress: ip, userAgent },
    });

    return { token, expiresAt };
  }

  // ─── RENDER: Watermarked display image ─────────────────────────────────────
  // Returns base64 JPEG — for canvas rendering ONLY (never served as direct image)

  async renderDisplayImage(
    token: string,
    userId: string,
    userRole: string,
  ): Promise<{ imageData: string; mimeType: string }> {
    const secret = this.config.get<string>('VIEW_TOKEN_SECRET')!;

    // 1. Verify JWT
    let payload: { sub: string; designId: string; role: string; jti: string; type: string };
    try {
      payload = this.jwt.verify(token, { secret }) as typeof payload;
    } catch {
      throw new ForbiddenException('Invalid or expired view token');
    }

    if (payload.type !== 'view' || payload.sub !== userId) {
      throw new ForbiddenException('Token subject mismatch');
    }

    // 2. Validate DB record + one-time use
    const record = await this.prisma.viewToken.findUnique({
      where: { token },
      include: { design: { select: { storageKey: true, fileType: true, vendorId: true } } },
    });

    if (!record) throw new ForbiddenException('Token not found');
    if (record.expiresAt < new Date()) throw new ForbiddenException('Token expired');
    if (record.usedAt) throw new ForbiddenException('Token already used');

    // Role check (re-validate)
    if (userRole === 'VENDOR' && record.design.vendorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 3. Mark as used immediately (one-time)
    await this.prisma.viewToken.update({ where: { token }, data: { usedAt: new Date() } });

    // 4. Fetch original from private storage (backend only)
    const originalBuffer = await this.storage.fetchFileBuffer(record.design.storageKey);

    // 5. Process: resize to DISPLAY resolution (NOT print quality) + watermark
    const displayBuffer = await this.processForDisplay(originalBuffer, userId, userRole);

    return {
      imageData: displayBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    };
  }

  private async processForDisplay(
    buffer: Buffer,
    userId: string,
    userRole: string,
  ): Promise<Buffer> {
    // Resize to screen display size — intentionally NOT high-res
    // This prevents using the display image for printing
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
