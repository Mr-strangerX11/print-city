import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateReviewDto {
  @IsString() productId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // Verify user actually purchased this product
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, paymentStatus: 'PAID' },
      },
    });
    if (!purchased) {
      throw new BadRequestException('You can only review products you have purchased');
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    return this.prisma.review.create({
      data: { userId, productId: dto.productId, rating: dto.rating, comment: dto.comment },
      include: { user: { select: { name: true, avatar: true } } },
    });
  }

  async listForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    });
  }

  async getUserReviewForProduct(userId: string, productId: string) {
    return this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }
}
