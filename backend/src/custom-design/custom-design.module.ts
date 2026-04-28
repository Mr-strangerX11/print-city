import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomDesignController } from './custom-design.controller';
import { CustomDesignService } from './custom-design.service';
import { CustomDesignOrder, CustomDesignOrderSchema } from './schemas/custom-design-order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomDesignOrder.name, schema: CustomDesignOrderSchema },
    ]),
  ],
  controllers: [CustomDesignController],
  providers: [CustomDesignService],
})
export class CustomDesignModule {}
