import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Review, ReviewDocument } from './schemas/review.schema';
import { OrderItem, OrderItemDocument } from '../orders/schemas/order-item.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

export class CreateReviewDto {
  @IsString() productId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItemDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const uid = new Types.ObjectId(userId);
    const pid = new Types.ObjectId(dto.productId);

    // Verify user purchased this product
    const paidOrders = await this.orderModel
      .find({ userId: uid, paymentStatus: 'PAID' }, { _id: 1 })
      .lean()
      .exec();
    const paidOrderIds = paidOrders.map((o) => o._id);

    const purchased = await this.orderItemModel
      .findOne({ productId: pid, orderId: { $in: paidOrderIds } })
      .lean()
      .exec();

    if (!purchased) {
      throw new BadRequestException('You can only review products you have purchased');
    }

    const existing = await this.reviewModel.findOne({ userId: uid, productId: pid }).exec();
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = await this.reviewModel.create({
      userId: uid,
      productId: pid,
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.reviewModel.findById(review._id).populate('userId', 'name avatar').lean().exec();
  }

  async listForProduct(productId: string) {
    return this.reviewModel
      .find({ productId: new Types.ObjectId(productId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar')
      .lean()
      .exec();
  }

  async getUserReviewForProduct(userId: string, productId: string) {
    return this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        productId: new Types.ObjectId(productId),
      })
      .lean()
      .exec();
  }
}
