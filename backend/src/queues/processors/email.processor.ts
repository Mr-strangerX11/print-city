import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';

export const EMAIL_QUEUE = 'email';

export interface EmailJobData {
  type: 'order_confirmation' | 'invoice' | 'status_update' | 'payout' | 'vendor_approval' | 'custom';
  to: string;
  subject?: string;
  html?: string;
  orderId?: string;
  total?: number;
  status?: string;
  invoice?: any;
  amount?: number;
  storeName?: string;
}

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mail: MailService) {}

  @Process()
  async handle(job: Job<EmailJobData>): Promise<void> {
    const { type, to } = job.data;
    this.logger.log(`Processing email job [${type}] → ${to}`);

    try {
      switch (type) {
        case 'order_confirmation':
          await this.mail.sendOrderConfirmation(to, job.data.orderId!, job.data.total!);
          break;
        case 'status_update':
          await this.mail.sendOrderStatusUpdate(to, job.data.orderId!, job.data.status!);
          break;
        case 'invoice':
          await this.mail.sendInvoiceEmail(to, job.data.invoice!);
          break;
        case 'payout':
          await this.mail.sendPayoutNotification(to, job.data.amount!);
          break;
        case 'vendor_approval':
          await this.mail.sendVendorApproval(to, job.data.storeName!);
          break;
        default:
          this.logger.warn(`Unknown email job type: ${type}`);
      }
    } catch (err) {
      this.logger.error(`Email job [${type}] failed for ${to}`, err);
      throw err;
    }
  }
}
