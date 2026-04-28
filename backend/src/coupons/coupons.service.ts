import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CouponType } from '../common/enums';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CouponUsage, CouponUsageDocument } from './schemas/coupon-usage.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    @InjectModel(CouponUsage.name) private couponUsageModel: Model<CouponUsageDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  // ── Admin: CRUD ───────────────────────────────────────────────────────────

  async create(dto: CreateCouponDto) {
    const existing = await this.couponModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (existing) throw new BadRequestException(`Coupon code "${dto.code}" already exists`);
    return this.couponModel.create({
      ...dto,
      code: dto.code.toUpperCase(),
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  async findAll(query: any): Promise<any> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.active === 'true') filter.isActive = true;
    if (query.active === 'false') filter.isActive = false;

    const [coupons, total] = await Promise.all([
      this.couponModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.couponModel.countDocuments(filter),
    ]);

    const items = await Promise.all(
      coupons.map(async (c) => {
        const usageCount = await this.couponUsageModel.countDocuments({ couponId: c._id });
        return { ...c, _count: { usages: usageCount } };
      }),
    );

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string): Promise<any> {
    const coupon = await this.couponModel.findById(id).lean().exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    const usageCount = await this.couponUsageModel.countDocuments({ couponId: coupon._id });
    return { ...coupon, _count: { usages: usageCount } };
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    await this.findOne(id);
    const updateData: any = { ...dto };
    if (dto.code) updateData.code = dto.code.toUpperCase();
    if (dto.expiresAt) updateData.expiresAt = new Date(dto.expiresAt);
    return this.couponModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.couponModel.findByIdAndDelete(id).exec();
  }

  // ── Customer: validate + apply ────────────────────────────────────────────

  async validate(dto: ValidateCouponDto, userId: string): Promise<{ coupon: any; discountAmount: number }> {
    const coupon = await this.couponModel.findOne({ code: dto.code.toUpperCase() }).exec();
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('This coupon is not active');

    const now = new Date();
    if (now < coupon.startsAt) throw new BadRequestException('Coupon is not yet valid');
    if (coupon.expiresAt && now > coupon.expiresAt) throw new BadRequestException('Coupon has expired');
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit!) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minOrderAmount !== null && dto.orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount is Rs. ${coupon.minOrderAmount} for this coupon`);
    }

    const userUsages = await this.couponUsageModel.countDocuments({
      couponId: coupon._id,
      userId: new Types.ObjectId(userId),
    });
    if (userUsages >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    const discountAmount = this.calculateDiscount(coupon, dto.orderAmount);
    return { coupon, discountAmount };
  }

  async applyCoupon(couponCode: string, userId: string, orderId: string, orderAmount: number) {
    const { coupon, discountAmount } = await this.validate({ code: couponCode, orderAmount }, userId);

    await this.couponUsageModel.create({
      couponId: coupon._id,
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
      discount: discountAmount,
    });

    await this.couponModel.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 } });

    await this.orderModel.findByIdAndUpdate(orderId, {
      couponCode: coupon.code,
      discountAmount,
    });

    return { discountAmount };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const [total, active, usageResult] = await Promise.all([
      this.couponModel.countDocuments(),
      this.couponModel.countDocuments({ isActive: true }),
      this.couponUsageModel.aggregate([
        { $group: { _id: null, totalDiscount: { $sum: '$discount' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      active,
      totalUsages: usageResult[0]?.count ?? 0,
      totalDiscountGiven: Number(usageResult[0]?.totalDiscount ?? 0),
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
      discount = 0;
    }
    return Math.min(discount, orderAmount);
  }
}
