import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { select: { price: true, color: true, size: true } },
            vendor: { select: { storeName: true, storeSlug: true } },
            category: { select: { name: true, slug: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
    });
  }

  async getWishlistProductIds(userId: string): Promise<string[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }

  async toggle(userId: string, productId: string): Promise<{ added: boolean }> {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      return { added: false };
    }

    await this.prisma.wishlistItem.create({ data: { userId, productId } });
    return { added: true };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { removed: true };
  }
}
