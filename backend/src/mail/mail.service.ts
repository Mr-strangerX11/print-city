import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT', 587)),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(to: string, orderId: string, total: number) {
    await this.send(to, 'Order Confirmed — Print City', `
      <h2>Your order has been confirmed!</h2>
      <p>Order ID: <strong>#${orderId.slice(-8).toUpperCase()}</strong></p>
      <p>Total: <strong>Rs. ${total.toFixed(2)}</strong></p>
      <p>We'll notify you when your order ships.</p>
    `);
  }

  async sendOrderStatusUpdate(to: string, orderId: string, status: string) {
    await this.send(to, `Order Update: ${status} — Print City`, `
      <h2>Order Status Update</h2>
      <p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> is now <strong>${status}</strong>.</p>
    `);
  }

  async sendVendorApproval(to: string, storeName: string) {
    await this.send(to, 'Your store is live — Print City', `
      <h2>Congratulations! Your store "${storeName}" is now active.</h2>
      <p>You can start uploading designs and earning commissions.</p>
    `);
  }

  async sendPayoutNotification(to: string, amount: number) {
    await this.send(to, 'Payout Processed — Print City', `
      <h2>Your payout of Rs. ${amount.toFixed(2)} has been processed.</h2>
      <p>Please allow 3-5 business days for funds to arrive.</p>
    `);
  }

  async sendInvoiceEmail(to: string, invoice: any) {
    const fmt = (n: number | string) =>
      `Rs. ${Number(n).toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;

    const itemRows = (invoice.items ?? [])
      .map(
        (item: any) => `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 16px;font-size:13px;color:#374151;">
            <strong>${item.productName}</strong><br/>
            <span style="font-size:11px;color:#9CA3AF;">${item.variantLabel}</span>
          </td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#374151;">${item.qty}</td>
          <td style="padding:12px 16px;text-align:right;font-size:13px;color:#374151;">${fmt(item.unitPrice)}</td>
          <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#111827;">${fmt(item.total)}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#7C3AED,#2563EB);padding:32px 40px;">
    <div style="font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Print City</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Custom Print Marketplace</div>
    <div style="margin-top:16px;font-size:28px;font-weight:900;color:#fff;">Invoice Ready</div>
  </div>

  <!-- Body -->
  <div style="padding:32px 40px;">
    <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hi <strong>${invoice.user?.name ?? 'Customer'}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;margin:0 0 24px;">Your invoice for order <strong style="color:#111827;">#${(invoice.order?.id ?? '').slice(-8).toUpperCase()}</strong> is ready.</p>

    <!-- Invoice Meta -->
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;">
      <div>
        <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Invoice Number</div>
        <div style="font-size:15px;font-weight:700;color:#7C3AED;">${invoice.invoiceNumber}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">Date Issued</div>
        <div style="font-size:14px;font-weight:600;color:#374151;">${new Date(invoice.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#F3F4F6;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Item</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Total -->
    <div style="border-top:2px solid #111827;padding-top:16px;text-align:right;margin-bottom:24px;">
      <span style="font-size:18px;font-weight:900;color:#111827;">Total: </span>
      <span style="font-size:22px;font-weight:900;color:#7C3AED;">${fmt(invoice.total)}</span>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard/invoices/${invoice.id}"
         style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#2563EB);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        View Invoice
      </a>
    </div>

    <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:24px;">
      You can download the PDF from your dashboard. If you have questions, contact us at support@printcity.com.np
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
    <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Kathmandu, Nepal</p>
  </div>

</div>
</body>
</html>`;

    await this.send(to, `Invoice ${invoice.invoiceNumber} — Print City`, html);
  }

  async sendVerificationOtp(to: string, name: string, otp: string) {
    const html = `
    <div style="max-width:480px;margin:40px auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#7C3AED,#2563EB);padding:32px 40px;">
        <div style="font-size:22px;font-weight:900;color:#fff;">Print City</div>
        <div style="margin-top:12px;font-size:20px;font-weight:700;color:#fff;">Verify your email</div>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6B7280;font-size:14px;">Use the OTP below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="margin:24px 0;text-align:center;">
          <div style="display:inline-block;background:#F5F3FF;border:2px dashed #7C3AED;border-radius:12px;padding:18px 40px;">
            <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#7C3AED;">${otp}</span>
          </div>
        </div>
        <p style="color:#9CA3AF;font-size:12px;text-align:center;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
      <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 40px;text-align:center;">
        <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Kathmandu, Nepal</p>
      </div>
    </div>`;
    await this.send(to, 'Your Print City verification code', html);
  }

  async sendWishlistPriceAlert(to: string, name: string, items: { title: string; oldPrice: number; newPrice: number; slug: string }[]) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();
    const fmt = (n: number) => `Rs. ${n.toLocaleString('en-NP', { minimumFractionDigits: 0 })}`;
    const rows = items.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #F3F4F6;">
        <div>
          <a href="${frontendUrl}/products/${item.slug}" style="font-size:14px;font-weight:700;color:#111827;text-decoration:none;">${item.title}</a>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:16px;">
          <span style="font-size:12px;color:#9CA3AF;text-decoration:line-through;">${fmt(item.oldPrice)}</span>
          <span style="margin-left:6px;font-size:15px;font-weight:900;color:#059669;">${fmt(item.newPrice)}</span>
        </div>
      </div>`).join('');

    const html = `
    <div style="max-width:520px;margin:40px auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#059669,#0D9488);padding:28px 36px;">
        <div style="font-size:22px;font-weight:900;color:#fff;">Print City</div>
        <div style="margin-top:10px;font-size:20px;font-weight:700;color:#fff;">🎉 Wishlist price drop!</div>
      </div>
      <div style="padding:28px 36px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6B7280;font-size:14px;">Good news! Items in your wishlist just got cheaper:</p>
        <div style="margin:20px 0;">${rows}</div>
        <div style="text-align:center;margin-top:24px;">
          <a href="${frontendUrl}/wishlist" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#2563EB);color:#fff;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">View Wishlist</a>
        </div>
      </div>
      <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 36px;text-align:center;">
        <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Kathmandu, Nepal</p>
      </div>
    </div>`;
    await this.send(to, '🎉 Price drop on your wishlist — Print City', html);
  }

  async sendAbandonedCartEmail(to: string, name: string, items: { title: string; price: number; qty: number; imageUrl?: string }[]) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();
    const fmt = (n: number) => `Rs. ${n.toLocaleString('en-NP', { minimumFractionDigits: 0 })}`;
    const rows = items.slice(0, 3).map(item => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F3F4F6;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" width="48" height="48" style="border-radius:8px;object-fit:cover;flex-shrink:0;" />` : ''}
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${item.title}</div>
          <div style="font-size:12px;color:#6B7280;">Qty: ${item.qty} · ${fmt(item.price)}</div>
        </div>
      </div>`).join('');

    const html = `
    <div style="max-width:520px;margin:40px auto;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#7C3AED,#2563EB);padding:28px 36px;">
        <div style="font-size:22px;font-weight:900;color:#fff;">Print City</div>
        <div style="margin-top:10px;font-size:20px;font-weight:700;color:#fff;">You left something behind 🛒</div>
      </div>
      <div style="padding:28px 36px;">
        <p style="color:#374151;font-size:15px;">Hi <strong>${name}</strong>,</p>
        <p style="color:#6B7280;font-size:14px;">You have items waiting in your cart. Complete your order before they sell out!</p>
        <div style="margin:20px 0;">${rows}</div>
        <div style="text-align:center;margin-top:24px;">
          <a href="${frontendUrl}/cart" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#2563EB);color:#fff;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">Complete My Order</a>
        </div>
        <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;">Don't want reminders? You can always clear your cart.</p>
      </div>
      <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 36px;text-align:center;">
        <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Kathmandu, Nepal</p>
      </div>
    </div>`;
    await this.send(to, 'You left items in your cart — Print City', html);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM', 'noreply@printcity.com.np'),
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }
}
