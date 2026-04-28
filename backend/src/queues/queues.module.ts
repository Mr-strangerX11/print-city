import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor, EMAIL_QUEUE } from './processors/email.processor';
import { MailModule } from '../mail/mail.module';

const REDIS_AVAILABLE = !!process.env.REDIS_URL;

@Module({
  imports: [
    ...(REDIS_AVAILABLE
      ? [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
              redis: config.get<string>('REDIS_URL'),
              defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 50,
              },
            }),
            inject: [ConfigService],
          }),
          BullModule.registerQueue({ name: EMAIL_QUEUE }),
        ]
      : []),
    MailModule,
  ],
  providers: REDIS_AVAILABLE ? [EmailProcessor] : [],
  exports: REDIS_AVAILABLE ? [BullModule] : [],
})
export class QueuesModule {}
