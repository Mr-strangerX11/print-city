import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, Role } from '@prisma/client';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { InvoicesService } from '../invoices/invoices.service';

export class CheckoutDto {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private notifications: NotificationsService,
    private mail: MailService,
    private invoicesService: InvoicesService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) throw new BadRequestException('Cart is empty');

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.variant.stock < item.qty) {
        throw new BadRequestException(`"${item.variant.product.title}" only has ${item.variant.stock} in stock`);
      }
    }

    // Build order items with commission breakdown
    const orderItemsData = await Promise.all(
      cart.items.map(async (item) => {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: item.variant.product.vendorId },
        });
        const price = Number(item.variant.price) * item.qty;
        const vendorCommission = price * (vendor?.commissionRate ?? 0.10);
        const adminAmount = price - vendorCommission;

        return {
          productId: item.variant.product.id,
          variantId: item.variant.id,
          vendorId: item.variant.product.vendorId,
          qty: item.qty,
          price,
          vendorCommission,
          adminAmount,
        };
      }),
    );

    const totalAmount = orderItemsData.reduce((sum, i) => sum + i.price, 0);

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentStatus: PaymentStatus.UNPAID,
          orderStatus: OrderStatus.PENDING,
          ...dto,
          items: { create: orderItemsData },
        },
        include: {
          items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, variant: true } },
        },
      });

      // Decrement stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variant.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      return newOrder;
    });

    await this.cartService.clearCart(userId);

    await this.notifications.create(userId, 'ORDER_PLACED', 'Order Placed', `Your order #${order.id.slice(-8).toUpperCase()} has been placed.`);

    return order;
  }

  async getStats() {
    const [totalOrders, pendingOrders, deliveredOrders, revenueAgg] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: PaymentStatus.PAID },
      }),
    ]);
    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    };
  }

  async findAll(userId: string, role: Role, query: any) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role === Role.CUSTOMER) where.userId = userId;
    if (query.status) where.orderStatus = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              variant: true,
            },
          },
          payment: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            variant: true,
            vendor: { select: { storeName: true } },
          },
        },
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (role === Role.CUSTOMER && order.userId !== userId) throw new ForbiddenException();
    return order;
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
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException();
    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellable.includes(order.orderStatus)) {
      throw new BadRequestException(`Cannot cancel an order that is ${order.orderStatus.toLowerCase()}`);
    }
    const updated = await this.prisma.order.update({ where: { id }, data: { orderStatus: OrderStatus.CANCELLED } });
    await this.notifications.create(userId, 'ORDER_STATUS', 'Order Cancelled', `Your order #${id.slice(-8).toUpperCase()} has been cancelled.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) await this.mail.sendOrderStatusUpdate(user.email, id, 'CANCELLED');
    return updated;
  }

  async updateStatus(id: string, status: OrderStatus, adminId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = OrdersService.VALID_TRANSITIONS[order.orderStatus] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.orderStatus} to ${status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { orderStatus: status },
    });

    // Auto-generate invoice on CONFIRMED (non-blocking)
    if (status === OrderStatus.CONFIRMED) {
      this.invoicesService.generateForOrder(id).catch(() => null);
    }

    // When delivered + paid → accrue vendor commissions
    if (status === OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.PAID) {
      await this.accrueCommissions(id);
    }

    await this.notifications.create(
      order.userId,
      'ORDER_STATUS',
      'Order Update',
      `Your order status has been updated to ${status}.`,
    );
    const user = await this.prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
    if (user?.email) await this.mail.sendOrderStatusUpdate(user.email, id, status);

    return updated;
  }

  async confirmPayment(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED },
    });

    // If already delivered, accrue commissions
    if (order.orderStatus === OrderStatus.DELIVERED) {
      await this.accrueCommissions(orderId);
    }

    return order;
  }

  private async accrueCommissions(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });

    for (const item of items) {
      await this.prisma.vendor.update({
        where: { id: item.vendorId },
        data: { totalEarnings: { increment: item.vendorCommission } },
      });
    }
  }
}
