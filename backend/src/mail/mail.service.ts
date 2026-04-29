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

  // ─── Order Emails ──────────────────────────────────────────────────────────

  async sendCustomerOrderConfirmation(to: string, name: string, order: any, items: any[]) {
    const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP', { minimumFractionDigits: 0 })}`;
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();
    const orderId = order._id?.toString() ?? order.id ?? '';

    const itemRows = items.map(item => `
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:12px 16px;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${item.productTitle ?? 'Product'}</div>
          <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${item.variantLabel ?? ''}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;font-size:13px;color:#374151;">${item.qty}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#111827;">${fmt(item.price)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#7C3AED,#2563EB);padding:32px 40px;">
    <div style="font-size:22px;font-weight:900;color:#fff;">Print City</div>
    <div style="margin-top:10px;font-size:24px;font-weight:900;color:#fff;">Thank you for your order! 🎉</div>
  </div>

  <div style="padding:32px 40px;">
    <p style="font-size:15px;color:#374151;">Hi <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;margin-bottom:24px;">
      Your order <strong style="color:#7C3AED;">#${orderId.slice(-8).toUpperCase()}</strong> has been placed and is being processed.
      We'll send you an update when it ships!
    </p>

    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;">Shipping To</div>
      <div style="font-size:13px;color:#374151;line-height:1.8;">
        <strong>${order.shippingName}</strong><br/>
        ${order.shippingPhone}<br/>
        ${order.shippingAddress}, ${order.shippingCity}<br/>
        ${[order.shippingState, order.shippingZip].filter(Boolean).join(', ')}, ${order.shippingCountry ?? 'Nepal'}
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#F3F4F6;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Item</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="border-top:2px solid #111827;padding-top:14px;text-align:right;margin-bottom:24px;">
      <span style="font-size:16px;font-weight:900;color:#111827;">Order Total: </span>
      <span style="font-size:20px;font-weight:900;color:#7C3AED;">${fmt(order.totalAmount)}</span>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${frontendUrl}/dashboard/orders" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#2563EB);color:#fff;padding:13px 30px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        Track My Order
      </a>
    </div>

    <p style="font-size:12px;color:#9CA3AF;text-align:center;">Questions? Email us at support@printcity.com.np</p>
  </div>

  <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:18px 40px;text-align:center;">
    <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Kathmandu, Nepal</p>
  </div>
</div></body></html>`;

    await this.send(to, `Order Confirmed #${orderId.slice(-8).toUpperCase()} — Print City`, html);
  }

  async sendAdminOrderNotification(to: string, order: any, customer: any, items: any[]) {
    const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP', { minimumFractionDigits: 0 })}`;
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();
    const orderId = order._id?.toString() ?? order.id ?? '';

    const itemRows = items.map(item => `
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:12px 16px;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${item.productTitle ?? 'Product'}</div>
          <div style="font-size:11px;color:#9CA3AF;">${item.variantLabel ?? ''} · Vendor: ${item.storeName ?? '—'}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;font-size:13px;color:#374151;">${item.qty}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;color:#374151;">${fmt(item.price)}</td>
        <td style="padding:12px 16px;text-align:right;font-size:12px;color:#059669;">${fmt(item.vendorCommission)}</td>
        <td style="padding:12px 16px;text-align:right;font-size:12px;font-weight:700;color:#7C3AED;">${fmt(item.adminAmount)}</td>
      </tr>`).join('');

    const totalVendor = items.reduce((s, i) => s + i.vendorCommission, 0);
    const totalAdmin = items.reduce((s, i) => s + i.adminAmount, 0);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:640px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#111827,#374151);padding:28px 40px;">
    <div style="font-size:20px;font-weight:900;color:#fff;">Print City — Admin</div>
    <div style="margin-top:8px;font-size:22px;font-weight:900;color:#fff;">New Order Received 🛒</div>
    <div style="margin-top:6px;font-size:13px;color:#9CA3AF;">Order #${orderId.slice(-8).toUpperCase()}</div>
  </div>

  <div style="padding:28px 40px;border-bottom:1px solid #F3F4F6;">
    <div style="font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;">Customer Details</div>
    <table style="width:100%;font-size:13px;color:#374151;">
      <tr><td style="padding:4px 0;font-weight:700;width:120px;">Name</td><td>${customer.name}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Email</td><td>${customer.email}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Phone</td><td>${customer.phone ?? order.shippingPhone ?? '—'}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Address</td><td>${order.shippingAddress}, ${order.shippingCity}, ${[order.shippingState, order.shippingZip].filter(Boolean).join(', ')}, ${order.shippingCountry ?? 'Nepal'}</td></tr>
      ${order.notes ? `<tr><td style="padding:4px 0;font-weight:700;">Notes</td><td>${order.notes}</td></tr>` : ''}
    </table>
  </div>

  <div style="padding:28px 40px;">
    <div style="font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;">Order Items</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#F3F4F6;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Item</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Total</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Vendor</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#7C3AED;text-transform:uppercase;">Platform</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="border-top:2px solid #111827;padding-top:14px;margin-top:8px;">
      <table style="width:100%;font-size:13px;">
        <tr>
          <td style="padding:4px 0;color:#6B7280;">Order Total</td>
          <td style="text-align:right;font-weight:900;font-size:18px;color:#111827;">${fmt(order.totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#059669;">Total Vendor Earnings</td>
          <td style="text-align:right;font-weight:700;color:#059669;">${fmt(totalVendor)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#7C3AED;">Platform Revenue</td>
          <td style="text-align:right;font-weight:700;color:#7C3AED;">${fmt(totalAdmin)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <a href="${frontendUrl}/admin/orders" style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        View in Admin Panel
      </a>
    </div>
  </div>

  <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 40px;text-align:center;">
    <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Admin Notification</p>
  </div>
</div></body></html>`;

    await this.send(to, `[Admin] New Order #${orderId.slice(-8).toUpperCase()} — Rs. ${fmt(order.totalAmount)}`, html);
  }

  async sendVendorOrderNotification(to: string, storeName: string, orderId: string, items: any[], totalCommission: number) {
    const fmt = (n: number) => `Rs. ${Number(n).toLocaleString('en-NP', { minimumFractionDigits: 0 })}`;
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000').split(',')[0].trim();

    const itemRows = items.map(item => `
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:12px 16px;">
          <div style="font-size:13px;font-weight:700;color:#111827;">${item.productTitle ?? 'Product'}</div>
          <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${item.variantLabel ?? ''}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;font-size:13px;color:#374151;">${item.qty}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;color:#374151;">${fmt(item.price)}</td>
        <td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#059669;">${fmt(item.vendorCommission)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#059669,#0D9488);padding:28px 40px;">
    <div style="font-size:20px;font-weight:900;color:#fff;">Print City</div>
    <div style="margin-top:8px;font-size:22px;font-weight:900;color:#fff;">New sale for your store! 💸</div>
    <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.75);">Order #${orderId.slice(-8).toUpperCase()} · ${storeName}</div>
  </div>

  <div style="padding:28px 40px;">
    <p style="font-size:14px;color:#6B7280;margin-bottom:24px;">
      Hi <strong>${storeName}</strong>, you have a new order! Here are the items your store needs to prepare:
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#F3F4F6;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Item</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;">Sale Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;">Your Earnings</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="background:#F0FDF4;border:1px solid #D1FAE5;border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Your Total Commission</div>
      <div style="font-size:28px;font-weight:900;color:#059669;">${fmt(totalCommission)}</div>
      <div style="font-size:11px;color:#6B7280;margin-top:4px;">Will be included in your next payout</div>
    </div>

    <div style="text-align:center;">
      <a href="${frontendUrl}/vendor/dashboard" style="display:inline-block;background:linear-gradient(135deg,#059669,#0D9488);color:#fff;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        Go to Vendor Dashboard
      </a>
    </div>
  </div>

  <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 40px;text-align:center;">
    <p style="font-size:11px;color:#9CA3AF;margin:0;">© ${new Date().getFullYear()} Print City · Vendor Notification</p>
  </div>
</div></body></html>`;

    await this.send(to, `[New Sale] Order #${orderId.slice(-8).toUpperCase()} — ${fmt(totalCommission)} earned`, html);
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
