import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { VendorStatus } from '../common/enums';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.status) filter.status = query.status;

    const vendors = await this.vendorModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email createdAt')
      .lean()
      .exec();

    // Add product count
    const result = await Promise.all(
      vendors.map(async (v) => {
        const productCount = await this.productModel.countDocuments({ vendorId: v._id });
        return { ...v, _count: { products: productCount } };
      }),
    );

    return result;
  }

  async findBySlug(slug: string) {
    const vendor = await this.vendorModel
      .findOne({ storeSlug: slug })
      .populate('userId', 'name avatar')
      .lean()
      .exec();
    if (!vendor) throw new NotFoundException('Vendor not found');

    const products = await this.productModel
      .find({ vendorId: vendor._id, status: 'ACTIVE' })
      .limit(20)
      .lean()
      .exec();

    const productCount = await this.productModel.countDocuments({ vendorId: vendor._id });

    return { ...vendor, products, _count: { products: productCount } };
  }

  async updateStatus(id: string, status: VendorStatus) {
    const vendor = await this.vendorModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!vendor) throw new NotFoundException();
    return vendor;
  }

  async updateCommission(id: string, commissionRate: number) {
    if (commissionRate < 0 || commissionRate > 1) {
      throw new BadRequestException('Commission rate must be between 0 and 1 (0% – 100%)');
    }
    const vendor = await this.vendorModel.findByIdAndUpdate(id, { commissionRate }, { new: true }).exec();
    if (!vendor) throw new NotFoundException();
    return vendor;
  }

  async getProfile(userId: string) {
    const vendor = await this.vendorModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'name email avatar')
      .lean()
      .exec();
    if (!vendor) throw new NotFoundException('Vendor profile not found');

    const productCount = await this.productModel.countDocuments({ vendorId: vendor._id });
    return { ...vendor, _count: { products: productCount } };
  }

  async updateProfile(userId: string, dto: { storeName?: string; description?: string; logo?: string; banner?: string }) {
    const vendor = await this.vendorModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!vendor) throw new NotFoundException();
    return this.vendorModel.findByIdAndUpdate(vendor._id, dto, { new: true }).exec();
  }
}
