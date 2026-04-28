import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DesignsModule } from '../designs/designs.module';
import { PrintSecureController } from './print-secure.controller';
import { PrintSecureService } from './print-secure.service';
import { DesignPrintJob, DesignPrintJobSchema } from '../designs/schemas/design-print-job.schema';
import { Design, DesignSchema } from '../designs/schemas/design.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DesignPrintJob.name, schema: DesignPrintJobSchema },
      { name: Design.name, schema: DesignSchema },
    ]),
    DesignsModule,
  ],
  controllers: [PrintSecureController],
  providers: [PrintSecureService],
})
export class PrintSecureModule {}
