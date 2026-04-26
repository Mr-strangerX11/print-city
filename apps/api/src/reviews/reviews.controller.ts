import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Public()
  @Get('product/:productId')
  listForProduct(@Param('productId') productId: string) {
    return this.reviewsService.listForProduct(productId);
  }

  @Get('my/:productId')
  myReview(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.reviewsService.getUserReviewForProduct(userId, productId);
  }
}
