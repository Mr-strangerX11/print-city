import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { MongooseModule } from '@nestjs/mongoose';
import { memoryStorage } from 'multer';

import { SecureStorageService } from '../storage/secure-storage.service';
import { DesignsController } from './designs.controller';
import { DesignsService } from './designs.service';
import { Design, DesignSchema } from './schemas/design.schema';
import { ViewToken, ViewTokenSchema } from './schemas/view-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Design.name, schema: DesignSchema },
      { name: ViewToken.name, schema: ViewTokenSchema },
    ]),
    JwtModule.register({}),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [DesignsController],
  providers: [DesignsService, SecureStorageService],
  exports: [DesignsService, SecureStorageService],
})
export class DesignsModule {}
