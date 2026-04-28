import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { PrismaModule } from '../prisma/prisma.module';
import { SecureStorageService } from '../storage/secure-storage.service';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [DesignsController],
  providers: [DesignsService, SecureStorageService],
  exports: [DesignsService, SecureStorageService],
})
export class DesignsModule {}
