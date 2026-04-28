import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponType } from '@prisma/client';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  // ── Admin: CRUD ───────────────────────────────────────────────────────────

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException(`Coupon code "${dto.code}" already exists`);
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        value: dto.value,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async findAll(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { usages: true } } } }),
      this.prisma.coupon.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id }, include: { _count: { select: { usages: true } } } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    await this.findOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.code && { code: dto.code.toUpperCase() }),
        ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  // ── Customer: validate + apply ────────────────────────────────────────────

  async validate(dto: ValidateCouponDto, userId: string): Promise<{ coupon: any; discountAmount: number }> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('This coupon is not active');

    const now = new Date();
    if (now < coupon.startsAt) throw new BadRequestException('Coupon is not yet valid');
    if (coupon.expiresAt && now > coupon.expiresAt) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount !== null && dto.orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount is Rs. ${coupon.minOrderAmount} for this coupon`);
    }

    // Per-user limit
    const userUsages = await this.prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUsages >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    const discountAmount = this.calculateDiscount(coupon, dto.orderAmount);
    return { coupon, discountAmount };
  }

  async applyCoupon(couponCode: string, userId: string, orderId: string, orderAmount: number) {
    const { coupon, discountAmount } = await this.validate({ code: couponCode, orderAmount }, userId);

    await this.prisma.$transaction([
      this.prisma.couponUsage.create({
        data: { couponId: coupon.id, userId, orderId, discount: discountAmount },
      }),
      this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { couponCode: coupon.code, discountAmount },
      }),
    ]);

    return { discountAmount };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const [total, active, totalDiscount] = await this.prisma.$transaction([
      this.prisma.coupon.count(),
      this.prisma.coupon.count({ where: { isActive: true } }),
      this.prisma.couponUsage.aggregate({ _sum: { discount: true }, _count: { id: true } }),
    ]);
    return {
      total,
      active,
      totalUsages: totalDiscount._count.id,
      totalDiscountGiven: Number(totalDiscount._sum.discount ?? 0),
    };
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private calculateDiscount(coupon: any, orderAmount: number): number {
    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (orderAmount * Number(coupon.value)) / 100;
      if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else if (coupon.type === CouponType.FIXED) {
      discount = Number(coupon.value);
    } else if (coupon.type === CouponType.FREE_SHIPPING) {
      discount = 0; // Handled at checkout level
    }
    return Math.min(discount, orderAmount);
  }
}
