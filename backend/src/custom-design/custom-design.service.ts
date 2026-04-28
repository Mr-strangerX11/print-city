import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomOrderStatus } from '../common/enums';
import { Role } from '../user/schemas/user.schema';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { CustomDesignOrder, CustomDesignOrderDocument } from './schemas/custom-design-order.schema';

export class CreateCustomDesignDto {
  @IsString() productType: string;
  @IsString() designUrl: string;
  @IsOptional() @IsString() publicId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(1) qty?: number;
}

export class UpdateCustomDesignDto {
  @IsOptional() status?: CustomOrderStatus;
  @IsOptional() @IsString() adminNotes?: string;
  @IsOptional() price?: number;
}

@Injectable()
export class CustomDesignService {
  constructor(
    @InjectModel(CustomDesignOrder.name) private customDesignOrderModel: Model<CustomDesignOrderDocument>,
  ) {}

  async create(userId: string, dto: CreateCustomDesignDto) {
    return this.customDesignOrderModel.create({
      userId: new Types.ObjectId(userId),
      productType: dto.productType,
      designUrl: dto.designUrl,
      publicId: dto.publicId,
      notes: dto.notes,
      size: dto.size,
      color: dto.color,
      qty: dto.qty ?? 1,
      status: CustomOrderStatus.PENDING,
    });
  }

  async findAll(userId: string, role: Role, query: any) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (role === Role.CUSTOMER) filter.userId = new Types.ObjectId(userId);
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
      this.customDesignOrderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean()
        .exec(),
      this.customDesignOrderModel.countDocuments(filter),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.customDesignOrderModel
      .findById(id)
      .populate('userId', 'name email')
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Custom design order not found');
    if (role === Role.CUSTOMER && order.userId.toString() !== userId) throw new ForbiddenException();
    return order;
  }

  async update(id: string, dto: UpdateCustomDesignDto) {
    const order = await this.customDesignOrderModel.findById(id).exec();
    if (!order) throw new NotFoundException();

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.adminNotes !== undefined) updateData.adminNotes = dto.adminNotes;
    if (dto.price !== undefined) updateData.price = dto.price;

    return this.customDesignOrderModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }
}
