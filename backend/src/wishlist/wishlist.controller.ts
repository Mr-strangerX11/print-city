import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser('id') userId: string): Promise<any> {
    return this.wishlistService.getWishlist(userId);
  }

  @Get('ids')
  getIds(@CurrentUser('id') userId: string) {
    return this.wishlistService.getWishlistProductIds(userId);
  }

  @Post(':productId')
  toggle(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.toggle(userId, productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.remove(userId, productId);
  }
}
