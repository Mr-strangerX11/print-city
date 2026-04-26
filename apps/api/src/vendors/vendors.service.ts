import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorStatus } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any) {
    const page = Number(query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    return this.prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { storeSlug: slug },
      include: {
        user: { select: { name: true, avatar: true } },
        products: {
          where: { status: 'ACTIVE' },
          include: { images: { where: { isPrimary: true }, take: 1 }, variants: { select: { price: true } } },
          take: 20,
        },
        _count: { select: { products: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async updateStatus(id: string, status: VendorStatus) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException();
    return this.prisma.vendor.update({ where: { id }, data: { status } });
  }

  async updateCommission(id: string, commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 1) {
      throw new BadRequestException('Commission rate must be between 0 and 1 (0% – 100%)');
    }
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException();
    return this.prisma.vendor.update({ where: { id }, data: { commissionRate } });
  }

  async getProfile(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        _count: { select: { products: true, payouts: true } },
      },
    });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor;
  }

  async updateProfile(userId: string, dto: { storeName?: string; description?: string; logo?: string; banner?: string }) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException();
    return this.prisma.vendor.update({ where: { id: vendor.id }, data: dto });
  }
}
