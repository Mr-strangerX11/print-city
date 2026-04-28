import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { PrintJob, PrintJobSchema } from './schemas/print-job.schema';
import { QualityCheck, QualityCheckSchema } from './schemas/quality-check.schema';
import { Shipment, ShipmentSchema } from './schemas/shipment.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrintJob.name, schema: PrintJobSchema },
      { name: QualityCheck.name, schema: QualityCheckSchema },
      { name: Shipment.name, schema: ShipmentSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
