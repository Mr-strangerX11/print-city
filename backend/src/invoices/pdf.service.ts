import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(invoice: any): Promise<Buffer> {
    try {
      // Dynamic import so the app boots even if puppeteer isn't installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const puppeteer = await (eval('import("puppeteer")') as Promise<any>).catch(() => null);
      if (!puppeteer) {
        throw new Error('puppeteer is not installed. Run: npm install puppeteer');
      }
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(this.buildHtml(invoice), { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
      await browser.close();
      return Buffer.from(pdf);
    } catch (err) {
      this.logger.error('PDF generation failed', err);
      throw err;
    }
  }

  private fmt(n: number | string) {
    return `Rs. ${Number(n).toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;
  }

  private buildHtml(inv: any): string {
    const order = inv.order;
    const payment = order?.payment;
    const itemRows = (inv.items ?? []).map((item: any) => `
      <tr>
        <td class="item-cell">
          ${item.productImageUrl ? `<img src="${item.productImageUrl}" class="item-img" alt="" />` : '<div class="item-img-placeholder"></div>'}
          <div>
            <div class="item-name">${item.productName}</div>
            <div class="item-meta">${item.variantLabel}</div>
          </div>
        </td>
        <td class="text-center">${item.qty}</td>
        <td class="text-right">${this.fmt(item.unitPrice)}</td>
        <td class="text-right bold">${this.fmt(item.total)}</td>
      </tr>
    `).join('');

    const statusColor: Record<string, string> = {
      ISSUED: '#2563EB',
      PAID: '#059669',
      CANCELLED: '#DC2626',
      REFUNDED: '#7C3AED',
    };
    const badgeColor = statusColor[inv.status] ?? '#6B7280';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice ${inv.invoiceNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',system-ui,sans-serif;color:#111827;background:#fff;font-size:13px;line-height:1.5;}
  .page{max-width:800px;margin:0 auto;padding:48px;}

  /* ── Header ── */
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:32px;border-bottom:2px solid #F3F4F6;}
  .brand{display:flex;flex-direction:column;gap:4px;}
  .brand-name{font-size:26px;font-weight:900;background:linear-gradient(135deg,#7C3AED,#2563EB);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .brand-tagline{font-size:11px;color:#9CA3AF;font-weight:500;letter-spacing:.5px;text-transform:uppercase;}
  .brand-addr{font-size:11px;color:#6B7280;margin-top:8px;line-height:1.7;}
  .invoice-meta{text-align:right;}
  .invoice-label{font-size:28px;font-weight:900;color:#111827;letter-spacing:-1px;}
  .invoice-num{font-size:13px;font-weight:700;color:#7C3AED;margin-top:4px;}
  .status-badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff;background:${badgeColor};margin-top:6px;}
  .meta-row{font-size:11px;color:#6B7280;margin-top:4px;}
  .meta-row strong{color:#374151;}

  /* ── Addresses ── */
  .addresses{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:32px 0;}
  .addr-box h4{font-size:10px;font-weight:700;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;}
  .addr-box p{font-size:12.5px;color:#374151;line-height:1.7;}
  .addr-box strong{color:#111827;font-weight:700;}

  /* ── Payment info strip ── */
  .payment-strip{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px;}
  .payment-strip .pi-label{font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;}
  .payment-strip .pi-value{font-size:13px;font-weight:600;color:#111827;}

  /* ── Items table ── */
  table{width:100%;border-collapse:collapse;}
  thead tr{background:#7C3AED;color:#fff;}
  thead th{padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:left;}
  thead th:last-child,thead th:nth-child(2),thead th:nth-child(3){text-align:right;}
  tbody tr{border-bottom:1px solid #F3F4F6;}
  tbody tr:last-child{border-bottom:none;}
  tbody td{padding:12px 14px;vertical-align:middle;}
  .item-cell{display:flex;align-items:center;gap:12px;}
  .item-img{width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0;}
  .item-img-placeholder{width:44px;height:44px;border-radius:8px;background:#F3F4F6;flex-shrink:0;}
  .item-name{font-weight:600;color:#111827;font-size:13px;}
  .item-meta{font-size:11px;color:#9CA3AF;margin-top:2px;}
  .text-center{text-align:center;}
  .text-right{text-align:right;}
  .bold{font-weight:700;}

  /* ── Totals ── */
  .totals{display:flex;justify-content:flex-end;margin-top:24px;}
  .totals-box{width:280px;}
  .totals-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;}
  .totals-row:last-child{border-bottom:none;}
  .totals-row.grand{font-size:16px;font-weight:900;color:#111827;border-top:2px solid #111827;padding-top:12px;margin-top:4px;}
  .totals-row .label{}
  .totals-row .value{font-weight:600;color:#374151;}
  .totals-row.grand .value{color:#7C3AED;}

  /* ── Commission box (admin) ── */
  .commission-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:32px;}
  .commission-card{border:1px solid #E5E7EB;border-radius:10px;padding:16px;}
  .commission-card .cc-label{font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
  .commission-card .cc-value{font-size:20px;font-weight:900;color:#111827;}
  .commission-card.vendor-card{border-color:#D1FAE5;background:#F0FDF4;}
  .commission-card.vendor-card .cc-value{color:#059669;}
  .commission-card.admin-card{border-color:#EDE9FE;background:#F5F3FF;}
  .commission-card.admin-card .cc-value{color:#7C3AED;}

  /* ── Footer ── */
  .footer{margin-top:48px;padding-top:24px;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:flex-end;}
  .footer-left{font-size:11px;color:#9CA3AF;line-height:1.8;}
  .footer-right{text-align:right;}
  .footer-right .thank{font-size:13px;font-weight:700;color:#374151;}
  .footer-right .website{font-size:11px;color:#7C3AED;margin-top:3px;}
  .footer-stamp{width:80px;height:80px;border:2px solid #E5E7EB;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-left:24px;}
  .footer-stamp span{font-size:8px;font-weight:700;color:#D1D5DB;text-transform:uppercase;letter-spacing:.5px;}
  .stamp-area{display:flex;align-items:center;gap:0;}
  .watermark{font-size:9px;color:#D1D5DB;text-transform:uppercase;letter-spacing:2px;margin-top:8px;}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-name">Print City</div>
      <div class="brand-tagline">Custom Print Marketplace</div>
      <div class="brand-addr">
        Kathmandu, Nepal<br/>
        support@printcity.com.np<br/>
        +977-98XXXXXXXX
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-num">${inv.invoiceNumber}</div>
      <span class="status-badge">${inv.status}</span>
      <div class="meta-row" style="margin-top:10px"><strong>Order:</strong> #${(order?.id ?? '').slice(-8).toUpperCase()}</div>
      <div class="meta-row"><strong>Issued:</strong> ${new Date(inv.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="meta-row"><strong>Due:</strong> Upon receipt</div>
    </div>
  </div>

  <!-- Addresses -->
  <div class="addresses">
    <div class="addr-box">
      <h4>Bill To</h4>
      <p>
        <strong>${inv.user?.name ?? order?.shippingName ?? 'Customer'}</strong><br/>
        ${inv.user?.email ?? ''}<br/>
        ${inv.user?.phone ? inv.user.phone + '<br/>' : ''}
      </p>
    </div>
    <div class="addr-box">
      <h4>Ship To</h4>
      <p>
        <strong>${order?.shippingName ?? ''}</strong><br/>
        ${order?.shippingPhone ? order.shippingPhone + '<br/>' : ''}
        ${order?.shippingAddress ?? ''}<br/>
        ${[order?.shippingCity, order?.shippingState].filter(Boolean).join(', ')}${order?.shippingZip ? ' ' + order.shippingZip : ''}<br/>
        ${order?.shippingCountry ?? 'Nepal'}
      </p>
    </div>
  </div>

  <!-- Payment Info -->
  <div class="payment-strip">
    <div>
      <div class="pi-label">Payment Method</div>
      <div class="pi-value">${payment?.provider ?? 'N/A'}</div>
    </div>
    <div>
      <div class="pi-label">Payment Status</div>
      <div class="pi-value">${order?.paymentStatus ?? 'N/A'}</div>
    </div>
    <div>
      <div class="pi-label">Transaction ID</div>
      <div class="pi-value">${payment?.externalId ?? '—'}</div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:45%">Item</th>
        <th style="width:10%;text-align:center">Qty</th>
        <th style="width:20%;text-align:right">Unit Price</th>
        <th style="width:25%;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span class="label">Subtotal</span><span class="value">${this.fmt(inv.subtotal)}</span></div>
      ${Number(inv.discount) > 0 ? `<div class="totals-row"><span class="label">Discount</span><span class="value" style="color:#059669">−${this.fmt(inv.discount)}</span></div>` : ''}
      <div class="totals-row"><span class="label">Shipping</span><span class="value">${Number(inv.shipping) === 0 ? 'Free' : this.fmt(inv.shipping)}</span></div>
      ${Number(inv.tax) > 0 ? `<div class="totals-row"><span class="label">Tax (13% VAT)</span><span class="value">${this.fmt(inv.tax)}</span></div>` : ''}
      <div class="totals-row grand"><span class="label">Total</span><span class="value">${this.fmt(inv.total)}</span></div>
    </div>
  </div>

  <!-- Commission Breakdown -->
  <div class="commission-grid">
    <div class="commission-card vendor-card">
      <div class="cc-label">Total Vendor Earnings</div>
      <div class="cc-value">${this.fmt(inv.totalVendorEarnings)}</div>
    </div>
    <div class="commission-card admin-card">
      <div class="cc-label">Platform Revenue</div>
      <div class="cc-value">${this.fmt(inv.totalAdminEarnings)}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      This is a computer-generated invoice and does not require a physical signature.<br/>
      For support contact support@printcity.com.np<br/>
      © ${new Date().getFullYear()} Print City. All rights reserved.
    </div>
    <div class="stamp-area">
      <div>
        <div class="footer-right">
          <div class="thank">Thank you for your order!</div>
          <div class="website">printcity.com.np</div>
        </div>
      </div>
      <div class="footer-stamp">
        <span>Print</span>
        <span>City</span>
      </div>
    </div>
  </div>

</div>
</body>
</html>`;
  }
}
