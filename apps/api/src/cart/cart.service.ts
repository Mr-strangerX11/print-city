import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 },
                    vendor: { select: { storeName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { images: { where: { isPrimary: true }, take: 1 }, vendor: { select: { storeName: true } } } },
                },
              },
            },
          },
        },
      });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.variant.price) * item.qty;
    }, 0);
    return { ...cart, subtotal };
  }

  async addItem(userId: string, variantId: string, qty: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    if (variant.stock < qty) throw new BadRequestException(`Only ${variant.stock} units available`);

    const cart = await this.getOrCreateCart(userId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productVariantId: { cartId: cart.id, productVariantId: variantId } },
    });

    if (existing) {
      const newQty = existing.qty + qty;
      if (variant.stock < newQty) throw new BadRequestException(`Only ${variant.stock} units available`);
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { qty: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productVariantId: variantId, qty },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, qty: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (qty <= 0) return this.removeItem(userId, itemId);
    if (item.variant.stock < qty) throw new BadRequestException('Insufficient stock');

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { cleared: true };
  }
}
