import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel('Cart') private cartModel: Model<any>,
    @InjectModel('CartItem') private cartItemModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('ProductVariant') private variantModel: Model<any>,
    @InjectModel('ProductImage') private imageModel: Model<any>,
    private mail: MailService,
  ) {}

  // Runs every hour — finds carts idle for 2–24 hours with items still inside
  @Cron(CronExpression.EVERY_HOUR)
  async sendAbandonedCartEmails() {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find carts updated between 2h and 24h ago
    const staleCarts = await this.cartModel
      .find({ updatedAt: { $lte: twoHoursAgo, $gte: oneDayAgo } })
      .lean()
      .exec();

    for (const cart of staleCarts) {
      try {
        const items = await this.cartItemModel
          .find({ cartId: cart._id })
          .lean()
          .exec();

        if (!items.length) continue;

        const user = await this.userModel
          .findById(cart.userId, { name: 1, email: 1 })
          .lean()
          .exec();
        if (!user?.email) continue;

        // Build item summaries for email
        const emailItems = await Promise.all(
          items.slice(0, 3).map(async (item: any) => {
            const variant = await this.variantModel.findById(item.productVariantId).lean().exec() as any;
            const product = variant ? await this.productModel.findById(variant.productId).lean().exec() as any : null;
            const image = product ? await this.imageModel.findOne({ productId: product._id, isPrimary: true }).lean().exec() as any : null;
            return {
              title: product?.title ?? 'Product',
              price: variant?.price ?? 0,
              qty: item.qty,
              imageUrl: image?.url,
            };
          }),
        );

        await this.mail.sendAbandonedCartEmail(user.email, user.name, emailItems);
        this.logger.log(`Sent abandoned cart email to ${user.email}`);
      } catch (err) {
        this.logger.error(`Failed abandoned cart email for cart ${cart._id}: ${err}`);
      }
    }
  }
}
