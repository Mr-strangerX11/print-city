import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrintJobStatus, QCStatus, ShipmentStatus, OrderStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductionService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PRINT JOBS
  // ──────────────────────────────────────────────────────────────────────────

  async createPrintJob(orderId: string, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const existing = await this.prisma.printJob.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Print job already exists for this order');

    return this.prisma.printJob.create({
      data: { orderId, status: PrintJobStatus.QUEUED, notes },
      include: { order: { include: { user: { select: { name: true, email: true } }, items: { include: { product: true } } } } },
    });
  }

  async listPrintJobs(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.printJob.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
              items: { include: { product: { select: { title: true } } } },
            },
          },
          qualityCheck: true,
        },
      }),
      this.prisma.printJob.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updatePrintJobStatus(id: string, status: PrintJobStatus, notes?: string) {
    const job = await this.prisma.printJob.findUnique({ where: { id }, include: { order: true } });
    if (!job) throw new NotFoundException('Print job not found');

    const updated = await this.prisma.printJob.update({
      where: { id },
      data: { status, notes, ...(status === PrintJobStatus.COMPLETED && { printedAt: new Date() }) },
    });

    // Map print job completion to order status
    if (status === PrintJobStatus.COMPLETED) {
      await this.prisma.order.update({ where: { id: job.orderId }, data: { orderStatus: OrderStatus.PRINTING } });
      await this.notifications.create(job.order.userId, 'ORDER_STATUS', 'Printing Started', `Your order is now being printed.`);
    }

    return updated;
  }

  async getPrintJobStats() {
    const [queued, inProgress, completed, failed] = await this.prisma.$transaction([
      this.prisma.printJob.count({ where: { status: PrintJobStatus.QUEUED } }),
      this.prisma.printJob.count({ where: { status: PrintJobStatus.IN_PROGRESS } }),
      this.prisma.printJob.count({ where: { status: PrintJobStatus.COMPLETED } }),
      this.prisma.printJob.count({ where: { status: PrintJobStatus.FAILED } }),
    ]);
    return { queued, inProgress, completed, failed, total: queued + inProgress + completed + failed };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // QUALITY CONTROL
  // ──────────────────────────────────────────────────────────────────────────

  async createQC(printJobId: string) {
    const job = await this.prisma.printJob.findUnique({ where: { id: printJobId } });
    if (!job) throw new NotFoundException('Print job not found');
    if (job.status !== PrintJobStatus.COMPLETED) throw new BadRequestException('Can only QC completed print jobs');

    const existing = await this.prisma.qualityCheck.findUnique({ where: { printJobId } });
    if (existing) return existing;

    return this.prisma.qualityCheck.create({ data: { printJobId, status: QCStatus.PENDING } });
  }

  async listQCJobs(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.qualityCheck.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          printJob: {
            include: {
              order: { include: { user: { select: { name: true } }, items: { include: { product: { select: { title: true } } } } } },
            },
          },
        },
      }),
      this.prisma.qualityCheck.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateQC(id: string, status: QCStatus, notes?: string, images?: string[]) {
    const qc = await this.prisma.qualityCheck.findUnique({ where: { id }, include: { printJob: { include: { order: true } } } });
    if (!qc) throw new NotFoundException('QC record not found');

    const updated = await this.prisma.qualityCheck.update({
      where: { id },
      data: { status, notes, ...(images && { images }), checkedAt: new Date() },
    });

    if (status === QCStatus.PASSED) {
      // Move order to PACKED
      await this.prisma.order.update({ where: { id: qc.printJob.orderId }, data: { orderStatus: OrderStatus.PACKED } });
      await this.notifications.create(qc.printJob.order.userId, 'ORDER_STATUS', 'Quality Checked', 'Your order passed quality check and is being packed.');
    } else if (status === QCStatus.FAILED || status === QCStatus.REWORK) {
      await this.prisma.printJob.update({ where: { id: qc.printJobId }, data: { status: PrintJobStatus.QUEUED } });
      await this.notifications.create(qc.printJob.order.userId, 'ORDER_STATUS', 'QC Update', `Your order is being re-processed for better quality.`);
    }

    return updated;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SHIPPING
  // ──────────────────────────────────────────────────────────────────────────

  async createShipment(orderId: string, data: { provider?: string; trackingNumber?: string; labelUrl?: string; estimatedAt?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
    if (!order) throw new NotFoundException('Order not found');
    const existing = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Shipment already exists for this order');

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        provider: data.provider,
        trackingNumber: data.trackingNumber,
        labelUrl: data.labelUrl,
        estimatedAt: data.estimatedAt ? new Date(data.estimatedAt) : null,
        status: ShipmentStatus.LABEL_CREATED,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: OrderStatus.SHIPPED, trackingNumber: data.trackingNumber },
    });
    await this.notifications.create(order.userId, 'ORDER_STATUS', 'Order Shipped!', `Your order has been shipped. Tracking: ${data.trackingNumber ?? 'N/A'}`);

    return shipment;
  }

  async listShipments(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shipment.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { order: { include: { user: { select: { name: true, email: true } } } } },
      }),
      this.prisma.shipment.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateShipmentStatus(id: string, status: ShipmentStatus, notes?: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id }, include: { order: true } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status, notes,
        ...(status === ShipmentStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(status === ShipmentStatus.PICKED_UP && { shippedAt: new Date() }),
      },
    });

    if (status === ShipmentStatus.DELIVERED) {
      await this.prisma.order.update({ where: { id: shipment.orderId }, data: { orderStatus: OrderStatus.DELIVERED } });
      await this.notifications.create(shipment.order.userId, 'ORDER_STATUS', 'Order Delivered!', 'Your order has been delivered.');
    }

    return updated;
  }
}
