import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { PdfService } from './pdf.service';
import { InvoiceStatus } from '../common/enums';
import { Role } from '../user/schemas/user.schema';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { InvoiceItem, InvoiceItemDocument } from './schemas/invoice-item.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderItem, OrderItemDocument } from '../orders/schemas/order-item.schema';
import { Vendor, VendorDocument } from '../vendors/schemas/vendor.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { ProductVariant, ProductVariantDocument } from '../products/schemas/product-variant.schema';
import { ProductImage, ProductImageDocument } from '../products/schemas/product-image.schema';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(InvoiceItem.name) private invoiceItemModel: Model<InvoiceItemDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductVariant.name) private variantModel: Model<ProductVariantDocument>,
    @InjectModel(ProductImage.name) private imageModel: Model<ProductImageDocument>,
    private mail: MailService,
    private pdf: PdfService,
  ) {}

  // ── Auto-generate on order CONFIRMED ─────────────────────────────────────

  async generateForOrder(orderId: string): Promise<void> {
    const oid = new Types.ObjectId(orderId);
    const existing = await this.invoiceModel.findOne({ orderId: oid }).exec();
    if (existing) return;

    const order = await this.orderModel
      .findById(oid)
      .populate('userId', 'name email phone')
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    const orderItems = await this.orderItemModel.find({ orderId: oid }).lean().exec();

    const year = new Date().getFullYear();
    const count = await this.invoiceModel.countDocuments({
      invoiceNumber: { $regex: `^INV-${year}-` },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

    const subtotal = orderItems.reduce((s, i) => s + Number(i.price), 0);
    const totalVendorEarnings = orderItems.reduce((s, i) => s + Number(i.vendorCommission), 0);
    const totalAdminEarnings = orderItems.reduce((s, i) => s + Number(i.adminAmount), 0);

    const invoice = await this.invoiceModel.create({
      invoiceNumber,
      orderId: oid,
      userId: order.userId,
      status: InvoiceStatus.ISSUED,
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: Number(order.totalAmount),
      totalVendorEarnings,
      totalAdminEarnings,
    });

    const invoiceItemDocs = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.productModel.findById(item.productId, { title: 1 }).lean().exec();
        const variant = await this.variantModel.findById(item.variantId, { size: 1, color: 1 }).lean().exec();
        const primaryImage = await this.imageModel
          .findOne({ productId: item.productId, isPrimary: true }, { url: 1 })
          .lean()
          .exec();

        return {
          invoiceId: invoice._id,
          productId: item.productId,
          variantId: item.variantId,
          vendorId: item.vendorId,
          productName: product?.title ?? '',
          variantLabel: `${variant?.size ?? ''} / ${variant?.color ?? ''}`,
          qty: item.qty,
          unitPrice: Number(item.price) / item.qty,
          total: Number(item.price),
          vendorEarning: Number(item.vendorCommission),
          adminEarning: Number(item.adminAmount),
          productImageUrl: primaryImage?.url ?? null,
        };
      }),
    );

    await this.invoiceItemModel.insertMany(invoiceItemDocs);

    const user = order.userId as any;
    if (user?.email) {
      const fullInvoice = await this.findOneRaw(invoice._id.toString());
      this.mail.sendInvoiceEmail(user.email, fullInvoice).catch(() => null);
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async findAll(userId: string, role: Role, query: InvoiceQueryDto): Promise<any> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role === Role.CUSTOMER) filter.userId = new Types.ObjectId(userId);
    if (query.status) filter.status = query.status;
    if (query.dateFrom || query.dateTo) {
      filter.issuedAt = {};
      if (query.dateFrom) filter.issuedAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.issuedAt.$lte = new Date(query.dateTo);
    }
    if (query.search) {
      filter.$or = [{ invoiceNumber: { $regex: query.search, $options: 'i' } }];
    }

    // For VENDOR: filter by invoices that have their items
    if (role === Role.VENDOR) {
      const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
      if (vendor) {
        const vendorInvoiceIds = await this.invoiceItemModel
          .distinct('invoiceId', { vendorId: vendor._id })
          .exec();
        filter._id = { $in: vendorInvoiceIds };
      }
    }

    const [invoices, total] = await Promise.all([
      this.invoiceModel
        .find(filter)
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean()
        .exec(),
      this.invoiceModel.countDocuments(filter),
    ]);

    const items = await Promise.all(
      invoices.map(async (inv) => {
        const itemCount = await this.invoiceItemModel.countDocuments({ invoiceId: inv._id });
        return { ...inv, _count: { items: itemCount } };
      }),
    );

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role): Promise<any> {
    const invoice = await this.findOneRaw(id);
    if (!invoice) throw new NotFoundException('Invoice not found');
    this.assertAccess(invoice, userId, role);
    return invoice;
  }

  async findByOrder(orderId: string, userId: string, role: Role): Promise<any> {
    const invoice = await this.invoiceModel
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .populate('userId', 'name email phone')
      .lean()
      .exec();
    if (!invoice) throw new NotFoundException('Invoice not found for this order');
    this.assertAccess(invoice, userId, role);

    const invoiceItems = await this.invoiceItemModel
      .find({ invoiceId: invoice._id })
      .populate('vendorId', 'storeName logo')
      .lean()
      .exec();

    return { ...invoice, items: invoiceItems };
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.invoiceModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async downloadPdf(id: string, userId: string, role: Role): Promise<Buffer> {
    const invoice = await this.findOne(id, userId, role);
    return this.pdf.generateInvoicePdf(invoice);
  }

  // ── Admin stats ───────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, issued, paid, monthly, revenueResult, monthlyResult] = await Promise.all([
      this.invoiceModel.countDocuments(),
      this.invoiceModel.countDocuments({ status: InvoiceStatus.ISSUED }),
      this.invoiceModel.countDocuments({ status: InvoiceStatus.PAID }),
      this.invoiceModel.countDocuments({ issuedAt: { $gte: startOfMonth } }),
      this.invoiceModel.aggregate([
        { $group: { _id: null, total: { $sum: '$total' }, adminEarnings: { $sum: '$totalAdminEarnings' }, vendorEarnings: { $sum: '$totalVendorEarnings' } } },
      ]),
      this.invoiceModel.aggregate([
        { $match: { issuedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, adminEarnings: { $sum: '$totalAdminEarnings' } } },
      ]),
    ]);

    return {
      total,
      issued,
      paid,
      monthlyCount: monthly,
      totalRevenue: Number(revenueResult[0]?.total ?? 0),
      totalAdminEarnings: Number(revenueResult[0]?.adminEarnings ?? 0),
      totalVendorEarnings: Number(revenueResult[0]?.vendorEarnings ?? 0),
      monthlyRevenue: Number(monthlyResult[0]?.total ?? 0),
      monthlyAdminEarnings: Number(monthlyResult[0]?.adminEarnings ?? 0),
    };
  }

  // ── Vendor-scoped earnings ────────────────────────────────────────────────

  async getVendorEarningsFromInvoices(vendorUserId: string) {
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(vendorUserId) }).lean().exec();
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const result = await this.invoiceItemModel.aggregate([
      { $match: { vendorId: vendor._id } },
      { $group: { _id: null, totalSales: { $sum: '$total' }, totalEarnings: { $sum: '$vendorEarning' }, count: { $sum: 1 } } },
    ]);

    return {
      totalSales: Number(result[0]?.totalSales ?? 0),
      totalEarnings: Number(result[0]?.totalEarnings ?? 0),
      totalItems: Number(result[0]?.count ?? 0),
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findOneRaw(id: string) {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('userId', 'name email phone')
      .lean()
      .exec();
    if (!invoice) return null;

    const invoiceItems = await this.invoiceItemModel
      .find({ invoiceId: invoice._id })
      .populate('vendorId', 'storeName logo')
      .lean()
      .exec();

    return { ...invoice, items: invoiceItems };
  }

  private assertAccess(invoice: any, userId: string, role: Role) {
    if (role === Role.ADMIN) return;
    if (role === Role.CUSTOMER && invoice.userId?._id?.toString() !== userId && invoice.userId?.toString() !== userId) {
      throw new ForbiddenException();
    }
    if (role === Role.VENDOR) {
      const hasVendorItem = invoice.items?.some(
        (item: any) => item.vendorId?.toString() === userId || item.vendorId?._id?.toString() === userId,
      );
      if (!hasVendorItem) throw new ForbiddenException();
    }
  }
}
