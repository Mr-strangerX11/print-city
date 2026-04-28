import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PayoutStatus, OrderStatus, PaymentStatus } from '../common/enums';
import { Role } from '../user/schemas/user.schema';
import { Payout, PayoutDocument } from './schemas/payout.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { OrderItem, OrderItemDocument } from '../orders/schemas/order-item.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async findAll(userId: string, role: Role, query: any) {
    const page = Number(query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (role === Role.VENDOR) {
      const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
      if (vendor) filter.vendorId = vendor._id;
    }
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.payoutModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vendorId', 'storeName')
        .lean()
        .exec(),
      this.payoutModel.countDocuments(filter),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getVendorEarnings(userId: string) {
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Delivered + paid orders
    const deliveredOrders = await this.orderModel
      .find({ orderStatus: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID }, { _id: 1 })
      .lean()
      .exec();
    const deliveredOrderIds = deliveredOrders.map((o) => o._id);

    const pendingItems = await this.orderItemModel
      .find({ vendorId: vendor._id, orderId: { $in: deliveredOrderIds } }, { vendorCommission: 1 })
      .lean()
      .exec();

    const paidPayoutsResult = await this.payoutModel.aggregate([
      { $match: { vendorId: vendor._id, status: PayoutStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingEarnings = pendingItems.reduce((sum, i) => sum + Number(i.vendorCommission), 0);

    return {
      totalEarnings: Number(vendor.totalEarnings),
      pendingEarnings,
      paidOut: Number(paidPayoutsResult[0]?.total ?? 0),
      pendingItemCount: pendingItems.length,
    };
  }

  async runPayouts(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Find all delivered+paid orders in the period
    const eligibleOrders = await this.orderModel
      .find({
        orderStatus: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        createdAt: { $gte: start, $lte: end },
      }, { _id: 1 })
      .lean()
      .exec();

    const eligibleOrderIds = eligibleOrders.map((o) => o._id);

    const orderItems = await this.orderItemModel
      .find({ orderId: { $in: eligibleOrderIds } }, { vendorId: 1, vendorCommission: 1 })
      .lean()
      .exec();

    const byVendor = new Map<string, number>();
    for (const item of orderItems) {
      const key = item.vendorId.toString();
      byVendor.set(key, (byVendor.get(key) ?? 0) + Number(item.vendorCommission));
    }

    const payouts: any[] = [];
    for (const [vendorId, amount] of byVendor.entries()) {
      if (amount > 0) {
        const payout = await this.payoutModel.create({
          vendorId: new Types.ObjectId(vendorId),
          amount,
          status: PayoutStatus.PAYABLE,
          periodStart: start,
          periodEnd: end,
        });
        payouts.push(payout);
      }
    }

    return { created: payouts.length, payouts };
  }

  async markPaid(payoutId: string) {
    const payout = await this.payoutModel.findById(payoutId).exec();
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.PAYABLE) {
      throw new BadRequestException(`Payout is ${payout.status.toLowerCase()}, not payable`);
    }
    return this.payoutModel.findByIdAndUpdate(
      payoutId,
      { status: PayoutStatus.PAID, paidAt: new Date() },
      { new: true },
    ).exec();
  }
}
