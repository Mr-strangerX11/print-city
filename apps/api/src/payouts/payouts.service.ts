import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutStatus, Role, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: Role, query: any) {
    const page = Number(query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role === Role.VENDOR) {
      const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
      if (vendor) where.vendorId = vendor.id;
    }
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { storeName: true } } },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getVendorEarnings(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    // Pending (delivered + paid orders, not yet in a payout)
    const pendingItems = await this.prisma.orderItem.findMany({
      where: {
        vendorId: vendor.id,
        order: {
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
        },
      },
      select: { vendorCommission: true, orderId: true },
    });

    // Already paid out
    const paidPayouts = await this.prisma.payout.aggregate({
      where: { vendorId: vendor.id, status: PayoutStatus.PAID },
      _sum: { amount: true },
    });

    const pendingEarnings = pendingItems.reduce((sum, i) => sum + Number(i.vendorCommission), 0);

    return {
      totalEarnings: Number(vendor.totalEarnings),
      pendingEarnings,
      paidOut: Number(paidPayouts._sum.amount ?? 0),
      pendingItemCount: pendingItems.length,
    };
  }

  async runPayouts(periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Find all delivered+paid orders in the period grouped by vendor
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          createdAt: { gte: start, lte: end },
        },
      },
      select: { vendorId: true, vendorCommission: true },
    });

    const byVendor = new Map<string, number>();
    for (const item of orderItems) {
      byVendor.set(item.vendorId, (byVendor.get(item.vendorId) ?? 0) + Number(item.vendorCommission));
    }

    const payouts: any[] = [];
    for (const [vendorId, amount] of byVendor.entries()) {
      if (amount > 0) {
        const payout = await this.prisma.payout.create({
          data: {
            vendorId,
            amount,
            status: PayoutStatus.PAYABLE,
            periodStart: start,
            periodEnd: end,
          },
        });
        payouts.push(payout);
      }
    }

    return { created: payouts.length, payouts };
  }

  async markPaid(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== PayoutStatus.PAYABLE) {
      throw new BadRequestException(`Payout is ${payout.status.toLowerCase()}, not payable`);
    }
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.PAID, paidAt: new Date() },
    });
  }
}
