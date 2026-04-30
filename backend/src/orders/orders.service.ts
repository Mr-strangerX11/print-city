import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IsEnum } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../common/enums';
import { Role, User, UserDocument } from '../user/schemas/user.schema';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CouponsService } from '../coupons/coupons.service';
import { Order, OrderDocument } from './schemas/order.schema';
import { OrderItem, OrderItemDocument } from './schemas/order-item.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantDocument } from '../products/schemas/product-variant.schema';
import { ProductImage, ProductImageDocument } from '../products/schemas/product-image.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

export class CheckoutDto {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  notes?: string;
  couponCode?: string;
  paymentMethod?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(ProductImage.name) private imageModel: Model<ProductImageDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cartService: CartService,
    private notifications: NotificationsService,
    private mail: MailService,
    private invoicesService: InvoicesService,
    private couponsService: CouponsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    for (const item of cart.items) {
      if (!item.variant) throw new BadRequestException('Invalid cart item');
      if (item.variant.stock < item.qty) {
        throw new BadRequestException(
          `"${item.variant.product?.title ?? 'Product'}" only has ${item.variant.stock} in stock`,
        );
      }
    }

    const orderItemsData = await Promise.all(
      cart.items.map(async (item) => {
        const vendor = await this.vendorModel
          .findById(item.variant!.product?.vendorId)
          .lean()
          .exec();
        const price = Number(item.variant!.price) * item.qty;
        const vendorCommission = price * (vendor?.commissionRate ?? 0.10);
        const adminAmount = price - vendorCommission;

        return {
          productId: new Types.ObjectId(item.variant!.product!._id.toString()),
          variantId: new Types.ObjectId(item.variant!._id.toString()),
          vendorId: new Types.ObjectId(item.variant!.product!.vendorId.toString()),
          qty: item.qty,
          price,
          vendorCommission,
          adminAmount,
        };
      }),
    );

    const subtotal = orderItemsData.reduce((sum, i) => sum + i.price, 0);
    const uid = new Types.ObjectId(userId);

    // Validate coupon and compute discount (before order creation so totalAmount is correct)
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    if (dto.couponCode) {
      try {
        const couponResult = await this.couponsService.validate(
          { code: dto.couponCode, orderAmount: subtotal },
          userId,
        );
        discountAmount = couponResult.discountAmount;
        appliedCouponCode = couponResult.coupon.code;
      } catch {
        // Invalid coupon — proceed without discount
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const { couponCode: _coupon, paymentMethod: _pm, ...shippingDto } = dto as any;
    const order = await this.orderModel.create({
      userId: uid,
      totalAmount,
      paymentStatus: PaymentStatus.UNPAID,
      orderStatus: OrderStatus.PENDING,
      ...shippingDto,
      ...(appliedCouponCode ? { couponCode: appliedCouponCode, discountAmount } : {}),
    });

    await this.orderItemModel.insertMany(
      orderItemsData.map((item) => ({ ...item, orderId: order._id })),
    );

    // Decrement stock
    for (const item of cart.items) {
      await this.variantModel.findByIdAndUpdate(item.variant!._id, {
        $inc: { stock: -item.qty },
      });
    }

    await this.cartService.clearCart(userId);

    // Record coupon usage so usage count is incremented and per-user limit is enforced
    if (appliedCouponCode) {
      this.couponsService.applyCoupon(appliedCouponCode, userId, order._id.toString(), subtotal).catch(() => null);
    }

    await this.notifications.create(
      userId,
      'ORDER_PLACED',
      'Order Placed',
      `Your order #${order._id.toString().slice(-8).toUpperCase()} has been placed.`,
    );

    this.sendOrderEmails(userId, order.toObject(), cart.items, orderItemsData).catch(() => null);

    const orderItems = await this.orderItemModel.find({ orderId: order._id }).lean().exec();
    return { ...order.toObject(), items: orderItems };
  }

  private async sendOrderEmails(userId: string, order: any, cartItems: any[], itemsData: any[]) {
    const enrichedItems = await Promise.all(
      cartItems.map(async (cartItem, i) => {
        const data = itemsData[i];
        const vendor = await this.vendorModel
          .findById(cartItem.variant?.product?.vendorId)
          .lean()
          .exec();
        return {
          productTitle: cartItem.variant?.product?.title ?? 'Product',
          variantLabel: [cartItem.variant?.size, cartItem.variant?.color].filter(Boolean).join(' · '),
          storeName: vendor?.storeName ?? '—',
          vendorId: data.vendorId.toString(),
          vendorUserId: vendor?.userId?.toString(),
          qty: cartItem.qty,
          price: data.price,
          vendorCommission: data.vendorCommission,
          adminAmount: data.adminAmount,
        };
      }),
    );

    const customer = await this.userModel.findById(userId).lean().exec();

    if (customer?.email) {
      this.mail.sendCustomerOrderConfirmation(customer.email, customer.name, order, enrichedItems).catch(() => null);
    }

    const admins = await this.userModel.find({ role: Role.ADMIN, isActive: true }).lean().exec();
    for (const admin of admins) {
      if (admin.email) {
        this.mail.sendAdminOrderNotification(admin.email, order, customer ?? {}, enrichedItems).catch(() => null);
      }
    }

    const vendorGroups = new Map<string, { items: typeof enrichedItems; vendorUserId?: string; storeName: string }>();
    for (const item of enrichedItems) {
      if (!vendorGroups.has(item.vendorId)) {
        vendorGroups.set(item.vendorId, { items: [], vendorUserId: item.vendorUserId, storeName: item.storeName });
      }
      vendorGroups.get(item.vendorId)!.items.push(item);
    }

    for (const [, group] of vendorGroups) {
      if (!group.vendorUserId) continue;
      const vendorUser = await this.userModel.findById(group.vendorUserId).lean().exec();
      if (vendorUser?.email) {
        const totalCommission = group.items.reduce((s, i) => s + i.vendorCommission, 0);
        this.mail.sendVendorOrderNotification(
          vendorUser.email,
          group.storeName,
          order._id.toString(),
          group.items,
          totalCommission,
        ).catch(() => null);
      }
    }
  }

  async getStats() {
    const [totalOrders, pendingOrders, deliveredOrders, revenueResult] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.countDocuments({ orderStatus: OrderStatus.PENDING }),
      this.orderModel.countDocuments({ orderStatus: OrderStatus.DELIVERED }),
      this.orderModel.aggregate([
        { $match: { paymentStatus: PaymentStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: Number(revenueResult[0]?.total ?? 0),
    };
  }

  async findAll(userId: string, role: Role, query: any): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role === Role.CUSTOMER) filter.userId = new Types.ObjectId(userId);
    if (query.status) filter.orderStatus = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const [orders, total] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('userId', 'name email')
        .lean().exec(),
      this.orderModel.countDocuments(filter),
    ]);

    const items = await Promise.all(
      orders.map(async (order) => {
        const [orderItems, payment] = await Promise.all([
          this.orderItemModel.find({ orderId: order._id }).lean().exec(),
          this.paymentModel.findOne({ orderId: order._id }).lean().exec(),
        ]);
        return { ...order, items: orderItems, payment };
      }),
    );

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role): Promise<any> {
    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'name email')
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    if (role === Role.CUSTOMER && order.userId.toString() !== userId) throw new ForbiddenException();

    const [orderItems, payment] = await Promise.all([
      this.orderItemModel.find({ orderId: new Types.ObjectId(id) }).lean().exec(),
      this.paymentModel.findOne({ orderId: new Types.ObjectId(id) }).lean().exec(),
    ]);

    return { ...order, items: orderItems, payment };
  }

  private static readonly VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PRINTING, OrderStatus.CANCELLED],
    [OrderStatus.PRINTING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  async cancelOrder(id: string, userId: string) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId.toString() !== userId) throw new ForbiddenException();
    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellable.includes(order.orderStatus)) {
      throw new BadRequestException(`Cannot cancel an order that is ${order.orderStatus.toLowerCase()}`);
    }
    order.orderStatus = OrderStatus.CANCELLED;
    const updated = await order.save();
    await this.notifications.create(userId, 'ORDER_STATUS', 'Order Cancelled', `Your order #${id.slice(-8).toUpperCase()} has been cancelled.`);
    return updated;
  }

  async updateStatus(id: string, status: OrderStatus, adminId: string) {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException('Order not found');

    const allowed = OrdersService.VALID_TRANSITIONS[order.orderStatus] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.orderStatus} to ${status}`);
    }

    order.orderStatus = status;
    const updated = await order.save();

    if (status === OrderStatus.CONFIRMED) {
      this.invoicesService.generateForOrder(id).catch(() => null);
    }

    if (status === OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.PAID) {
      await this.accrueCommissions(id);
    }

    await this.notifications.create(
      order.userId.toString(),
      'ORDER_STATUS',
      'Order Update',
      `Your order status has been updated to ${status}.`,
    );

    return updated;
  }

  async confirmPayment(orderId: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED },
      { new: true },
    ).exec();

    if (order && order.orderStatus === OrderStatus.DELIVERED) {
      await this.accrueCommissions(orderId);
    }

    return order;
  }

  private async accrueCommissions(orderId: string) {
    const items = await this.orderItemModel.find({ orderId: new Types.ObjectId(orderId) }).lean().exec();
    for (const item of items) {
      await this.vendorModel.findByIdAndUpdate(item.vendorId, {
        $inc: { totalEarnings: item.vendorCommission },
      });
    }
  }
}
