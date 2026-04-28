import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PrintJobStatus, QCStatus, ShipmentStatus, OrderStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { PrintJob, PrintJobDocument } from './schemas/print-job.schema';
import { QualityCheck, QualityCheckDocument } from './schemas/quality-check.schema';
import { Shipment, ShipmentDocument } from './schemas/shipment.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

@Injectable()
export class ProductionService {
  constructor(
    @InjectModel(PrintJob.name) private printJobModel: Model<PrintJobDocument>,
    @InjectModel(QualityCheck.name) private qualityCheckModel: Model<QualityCheckDocument>,
    @InjectModel(Shipment.name) private shipmentModel: Model<ShipmentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private notifications: NotificationsService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PRINT JOBS
  // ──────────────────────────────────────────────────────────────────────────

  async createPrintJob(orderId: string, notes?: string) {
    const oid = new Types.ObjectId(orderId);
    const order = await this.orderModel.findById(oid).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    const existing = await this.printJobModel.findOne({ orderId: oid }).exec();
    if (existing) throw new BadRequestException('Print job already exists for this order');

    const job = await this.printJobModel.create({
      orderId: oid,
      status: PrintJobStatus.QUEUED,
      notes,
    });

    return this.printJobModel
      .findById(job._id)
      .populate({
        path: 'orderId',
        populate: { path: 'userId', select: 'name email' },
      })
      .lean()
      .exec();
  }

  async listPrintJobs(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.printJobModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'orderId', populate: { path: 'userId', select: 'name email' } })
        .lean()
        .exec(),
      this.printJobModel.countDocuments(filter),
    ]);

    // Get associated QC jobs
    const enriched = await Promise.all(
      items.map(async (job) => {
        const qualityCheck = await this.qualityCheckModel
          .findOne({ printJobId: job._id })
          .lean()
          .exec();
        return { ...job, qualityCheck };
      }),
    );

    return { items: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updatePrintJobStatus(id: string, status: PrintJobStatus, notes?: string) {
    const job = await this.printJobModel.findById(id).lean().exec();
    if (!job) throw new NotFoundException('Print job not found');

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === PrintJobStatus.COMPLETED) updateData.printedAt = new Date();

    const updated = await this.printJobModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (status === PrintJobStatus.COMPLETED) {
      await this.orderModel.findByIdAndUpdate(job.orderId, { orderStatus: OrderStatus.PRINTING });
      const order = await this.orderModel.findById(job.orderId).lean().exec();
      if (order) {
        await this.notifications.create(order.userId.toString(), 'ORDER_STATUS', 'Printing Started', 'Your order is now being printed.');
      }
    }

    return updated;
  }

  async getPrintJobStats() {
    const [queued, inProgress, completed, failed] = await Promise.all([
      this.printJobModel.countDocuments({ status: PrintJobStatus.QUEUED }),
      this.printJobModel.countDocuments({ status: PrintJobStatus.IN_PROGRESS }),
      this.printJobModel.countDocuments({ status: PrintJobStatus.COMPLETED }),
      this.printJobModel.countDocuments({ status: PrintJobStatus.FAILED }),
    ]);
    return { queued, inProgress, completed, failed, total: queued + inProgress + completed + failed };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // QUALITY CONTROL
  // ──────────────────────────────────────────────────────────────────────────

  async createQC(printJobId: string) {
    const pjid = new Types.ObjectId(printJobId);
    const job = await this.printJobModel.findById(pjid).lean().exec();
    if (!job) throw new NotFoundException('Print job not found');
    if (job.status !== PrintJobStatus.COMPLETED) {
      throw new BadRequestException('Can only QC completed print jobs');
    }

    const existing = await this.qualityCheckModel.findOne({ printJobId: pjid }).lean().exec();
    if (existing) return existing;

    return this.qualityCheckModel.create({ printJobId: pjid, status: QCStatus.PENDING });
  }

  async listQCJobs(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.qualityCheckModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'printJobId', populate: { path: 'orderId', populate: { path: 'userId', select: 'name' } } })
        .lean()
        .exec(),
      this.qualityCheckModel.countDocuments(filter),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateQC(id: string, status: QCStatus, notes?: string, images?: string[]) {
    const qc = await this.qualityCheckModel
      .findById(id)
      .populate({ path: 'printJobId', populate: { path: 'orderId' } })
      .lean()
      .exec();
    if (!qc) throw new NotFoundException('QC record not found');

    const updateData: any = { status, checkedAt: new Date() };
    if (notes) updateData.notes = notes;
    if (images) updateData.images = images;

    const updated = await this.qualityCheckModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    const printJob = qc.printJobId as any;
    if (!printJob) return updated;

    const order = printJob.orderId as any;

    if (status === QCStatus.PASSED) {
      await this.orderModel.findByIdAndUpdate(order._id ?? order, { orderStatus: OrderStatus.PACKED });
      const userId = order.userId?._id?.toString() ?? order.userId?.toString();
      if (userId) {
        await this.notifications.create(userId, 'ORDER_STATUS', 'Quality Checked', 'Your order passed quality check and is being packed.');
      }
    } else if (status === QCStatus.FAILED || status === QCStatus.REWORK) {
      await this.printJobModel.findByIdAndUpdate(qc.printJobId, { status: PrintJobStatus.QUEUED });
      const userId = order.userId?._id?.toString() ?? order.userId?.toString();
      if (userId) {
        await this.notifications.create(userId, 'ORDER_STATUS', 'QC Update', 'Your order is being re-processed for better quality.');
      }
    }

    return updated;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SHIPPING
  // ──────────────────────────────────────────────────────────────────────────

  async createShipment(orderId: string, data: { provider?: string; trackingNumber?: string; labelUrl?: string; estimatedAt?: string }) {
    const oid = new Types.ObjectId(orderId);
    const order = await this.orderModel.findById(oid).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    const existing = await this.shipmentModel.findOne({ orderId: oid }).exec();
    if (existing) throw new BadRequestException('Shipment already exists for this order');

    const shipment = await this.shipmentModel.create({
      orderId: oid,
      provider: data.provider,
      trackingNumber: data.trackingNumber,
      labelUrl: data.labelUrl,
      estimatedAt: data.estimatedAt ? new Date(data.estimatedAt) : undefined,
      status: ShipmentStatus.LABEL_CREATED,
    });

    await this.orderModel.findByIdAndUpdate(oid, {
      orderStatus: OrderStatus.SHIPPED,
      trackingNumber: data.trackingNumber,
    });

    await this.notifications.create(
      order.userId.toString(),
      'ORDER_STATUS',
      'Order Shipped!',
      `Your order has been shipped. Tracking: ${data.trackingNumber ?? 'N/A'}`,
    );

    return shipment;
  }

  async listShipments(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.shipmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'orderId', populate: { path: 'userId', select: 'name email' } })
        .lean()
        .exec(),
      this.shipmentModel.countDocuments(filter),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateShipmentStatus(id: string, status: ShipmentStatus, notes?: string) {
    const shipment = await this.shipmentModel.findById(id).lean().exec();
    if (!shipment) throw new NotFoundException('Shipment not found');

    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    if (status === ShipmentStatus.DELIVERED) updateData.deliveredAt = new Date();
    if (status === ShipmentStatus.PICKED_UP) updateData.shippedAt = new Date();

    const updated = await this.shipmentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (status === ShipmentStatus.DELIVERED) {
      const order = await this.orderModel.findByIdAndUpdate(
        shipment.orderId,
        { orderStatus: OrderStatus.DELIVERED },
        { new: true },
      ).lean().exec();
      if (order) {
        await this.notifications.create(order.userId.toString(), 'ORDER_STATUS', 'Order Delivered!', 'Your order has been delivered.');
      }
    }

    return updated;
  }
}
