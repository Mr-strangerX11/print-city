import { Module } from '@nestjs/common';
import { CustomDesignController } from './custom-design.controller';
import { CustomDesignService } from './custom-design.service';

@Module({ controllers: [CustomDesignController], providers: [CustomDesignService] })
export class CustomDesignModule {}
