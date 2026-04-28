import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PdfService } from './pdf.service';
import { InvoiceStatus, Role } from '@prisma/client';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

const INVOICE_INCLUDE = {
  user: { select: { name: true, email: true, phone: true } },
  order: {
    include: {
      payment: true,
      items: {
        include: {
          product: { select: { title: true } },
          variant: { select: { size: true, color: true } },
          vendor: { select: { storeName: true } },
        },
      },
    },
  },
  items: {
    include: { vendor: { select: { storeName: true, logo: true } } },
    orderBy: { vendorId: 'asc' as const },
  },
};

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private pdf: PdfService,
  ) {}

  // ── Auto-generate on order CONFIRMED ─────────────────────────────────────

  async generateForOrder(orderId: string): Promise<void> {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return; // idempotent

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        payment: true,
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            variant: true,
            vendor: { select: { storeName: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Build invoice number: INV-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    const subtotal = order.items.reduce((s, i) => s + Number(i.price), 0);
    const totalVendorEarnings = order.items.reduce((s, i) => s + Number(i.vendorCommission), 0);
    const totalAdminEarnings = order.items.reduce((s, i) => s + Number(i.adminAmount), 0);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        userId: order.userId,
        status: InvoiceStatus.ISSUED,
        subtotal,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: Number(order.totalAmount),
        totalVendorEarnings,
        totalAdminEarnings,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            vendorId: item.vendorId,
            productName: item.product.title,
            variantLabel: `${item.variant.size} / ${item.variant.color}`,
            qty: item.qty,
            unitPrice: Number(item.price) / item.qty,
            total: Number(item.price),
            vendorEarning: Number(item.vendorCommission),
            adminEarning: Number(item.adminAmount),
            productImageUrl: item.product.images[0]?.url ?? null,
          })),
        },
      },
      include: INVOICE_INCLUDE,
    });

    // Send invoice email (non-blocking)
    if (order.user.email) {
      this.mail.sendInvoiceEmail(order.user.email, invoice).catch(() => null);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async findAll(userId: string, role: Role, query: InvoiceQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === Role.CUSTOMER) {
      where.userId = userId;
    } else if (role === Role.VENDOR) {
      // Vendor sees invoices that contain at least one of their items
      where.items = { some: { vendor: { userId } } };
    }
    // ADMIN sees all

    if (query.status) where.status = query.status;
    if (query.dateFrom || query.dateTo) {
      where.issuedAt = {};
      if (query.dateFrom) where.issuedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.issuedAt.lte = new Date(query.dateTo);
    }
    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    this.assertAccess(invoice, userId, role);
    return invoice;
  }

  async findByOrder(orderId: string, userId: string, role: Role) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw new NotFoundException('Invoice not found for this order');
    this.assertAccess(invoice, userId, role);
    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return this.prisma.invoice.update({ where: { id }, data: { status } });
  }

  async downloadPdf(id: string, userId: string, role: Role): Promise<Buffer> {
    const invoice = await this.findOne(id, userId, role);
    return this.pdf.generateInvoicePdf(invoice);
  }

  // ── Admin stats ───────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, issued, paid, monthly, revenueAgg, monthlyAgg] = await this.prisma.$transaction([
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.ISSUED } }),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      this.prisma.invoice.count({ where: { issuedAt: { gte: startOfMonth } } }),
      this.prisma.invoice.aggregate({ _sum: { total: true, totalAdminEarnings: true, totalVendorEarnings: true } }),
      this.prisma.invoice.aggregate({
        _sum: { total: true, totalAdminEarnings: true },
        where: { issuedAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      total,
      issued,
      paid,
      monthlyCount: monthly,
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      totalAdminEarnings: Number(revenueAgg._sum.totalAdminEarnings ?? 0),
      totalVendorEarnings: Number(revenueAgg._sum.totalVendorEarnings ?? 0),
      monthlyRevenue: Number(monthlyAgg._sum.total ?? 0),
      monthlyAdminEarnings: Number(monthlyAgg._sum.totalAdminEarnings ?? 0),
    };
  }

  // ── Vendor-scoped earnings ────────────────────────────────────────────────

  async getVendorEarningsFromInvoices(vendorUserId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId: vendorUserId } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const agg = await this.prisma.invoiceItem.aggregate({
      where: { vendorId: vendor.id },
      _sum: { vendorEarning: true, total: true },
      _count: { id: true },
    });

    return {
      totalSales: Number(agg._sum.total ?? 0),
      totalEarnings: Number(agg._sum.vendorEarning ?? 0),
      totalItems: agg._count.id,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private assertAccess(invoice: any, userId: string, role: Role) {
    if (role === Role.ADMIN) return;
    if (role === Role.CUSTOMER && invoice.userId !== userId) throw new ForbiddenException();
    if (role === Role.VENDOR) {
      const hasVendorItem = invoice.items?.some((item: any) => item.vendor?.userId === userId || item.vendorId);
      if (!hasVendorItem) throw new ForbiddenException();
    }
  }
}
