import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DesignsModule } from '../designs/designs.module';
import { PrintSecureController } from './print-secure.controller';
import { PrintSecureService } from './print-secure.service';

@Module({
  imports: [PrismaModule, DesignsModule],
  controllers: [PrintSecureController],
  providers: [PrintSecureService],
})
export class PrintSecureModule {}
