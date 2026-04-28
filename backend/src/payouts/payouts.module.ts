import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { Payout, PayoutSchema } from './schemas/payout.schema';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { OrderItem, OrderItemSchema } from '../orders/schemas/order-item.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payout.name, schema: PayoutSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
