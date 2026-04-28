import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

const ESEWA_SANDBOX_URL = 'https://rc-web.esewa.com.np/api/epay/main/v2/form';
const ESEWA_PROD_URL = 'https://epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_STATUS_SANDBOX = 'https://rc-web.esewa.com.np/api/epay/transaction/status/';
const ESEWA_STATUS_PROD = 'https://epay.esewa.com.np/api/epay/transaction/status/';

const KHALTI_SANDBOX_BASE = 'https://dev.khalti.com/api/v2';
const KHALTI_PROD_BASE = 'https://khalti.com/api/v2';

@Injectable()
export class PaymentsService {
  private _stripe: Stripe | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  private get stripe(): Stripe {
    if (!this._stripe) {
      const key = this.config.get<string>('STRIPE_SECRET_KEY');
      if (!key) throw new BadRequestException('Stripe is not configured on this server');
      this._stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
    }
    return this._stripe;
  }

  private get isProd() {
    return this.config.get('NODE_ENV') === 'production';
  }

  // ─── Stripe ────────────────────────────────────────────────────────────────

  async createCheckoutSession(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            variant: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(item.variant.price) * 100),
        product_data: {
          name: `${item.product.title} (${item.variant.size} / ${item.variant.color})`,
          images: item.product.images[0] ? [item.product.images[0].url] : [],
        },
      },
      quantity: item.qty,
    }));

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${this.config.get('FRONTEND_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/checkout/cancel?order_id=${orderId}`,
      metadata: { orderId, userId },
    });

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { externalId: session.id, provider: 'stripe' },
      create: {
        orderId,
        provider: 'stripe',
        amount: order.totalAmount,
        currency: 'USD',
        status: 'UNPAID',
        externalId: session.id,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Webhook signature verification failed');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) return { received: true };

      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'PAID', externalId: session.id },
      });

      await this.ordersService.confirmPayment(orderId);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const payment = await this.prisma.payment.findFirst({
        where: { externalId: intent.id },
      });
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return { received: true };
  }

  // ─── eSewa v2 ──────────────────────────────────────────────────────────────

  async initiateESewa(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    const merchantCode = this.config.get<string>('ESEWA_MERCHANT_CODE')!;
    const secretKey = this.config.get<string>('ESEWA_SECRET_KEY')!;
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;

    const totalAmount = Number(order.totalAmount).toFixed(2);
    const transactionUuid = randomUUID();

    // eSewa v2 HMAC-SHA256: sign "total_amount=X,transaction_uuid=Y,product_code=Z"
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const signature = createHmac('sha256', secretKey).update(message).digest('base64');

    // Store payment record with the transaction UUID so we can verify later
    await this.prisma.payment.upsert({
      where: { orderId },
      update: { externalId: transactionUuid, provider: 'esewa' },
      create: {
        orderId,
        provider: 'esewa',
        amount: order.totalAmount,
        currency: 'NPR',
        status: 'UNPAID',
        externalId: transactionUuid,
      },
    });

    return {
      paymentUrl: this.isProd ? ESEWA_PROD_URL : ESEWA_SANDBOX_URL,
      formData: {
        amount: totalAmount,
        tax_amount: '0',
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: merchantCode,
        success_url: `${frontendUrl}/checkout/esewa/success`,
        failure_url: `${frontendUrl}/checkout/esewa/failure?order_id=${orderId}`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
    };
  }

  async verifyESewa(encodedData: string) {
    // eSewa sends base64-encoded JSON in ?data= query param on success redirect
    let payload: Record<string, string>;
    try {
      payload = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid eSewa response data');
    }

    const { transaction_uuid, total_amount, signed_field_names, signature } = payload;
    if (!transaction_uuid || !total_amount || !signature) {
      throw new BadRequestException('Incomplete eSewa response');
    }

    const merchantCode = this.config.get<string>('ESEWA_MERCHANT_CODE')!;
    const secretKey = this.config.get<string>('ESEWA_SECRET_KEY')!;

    // Re-verify HMAC signature from callback payload
    const fields = (signed_field_names ?? 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names').split(',');
    const message = fields.map((f) => `${f}=${payload[f] ?? ''}`).join(',');
    const expected = createHmac('sha256', secretKey).update(message).digest('base64');

    if (expected !== signature) {
      throw new BadRequestException('eSewa signature mismatch');
    }

    // Server-to-server status check
    const statusUrl = this.isProd ? ESEWA_STATUS_PROD : ESEWA_STATUS_SANDBOX;
    const params = new URLSearchParams({
      product_code: merchantCode,
      total_amount,
      transaction_uuid,
    });

    const statusRes = await fetch(`${statusUrl}?${params.toString()}`);
    if (!statusRes.ok) throw new BadRequestException('eSewa status API unreachable');

    const statusData = (await statusRes.json()) as { status: string; ref_id?: string };
    if (statusData.status !== 'COMPLETE') {
      throw new BadRequestException(`eSewa payment not complete: ${statusData.status}`);
    }

    // Find payment by externalId (transaction_uuid) and mark paid
    const payment = await this.prisma.payment.findFirst({
      where: { externalId: transaction_uuid, provider: 'esewa' },
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'PAID') return { success: true, orderId: payment.orderId };

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', refundId: statusData.ref_id ?? null },
    });

    await this.ordersService.confirmPayment(payment.orderId);

    return { success: true, orderId: payment.orderId };
  }

  // ─── Khalti v2 ─────────────────────────────────────────────────────────────

  async initiateKhalti(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    const secretKey = this.config.get<string>('KHALTI_SECRET_KEY')!;
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;
    const apiBase = this.isProd ? KHALTI_PROD_BASE : KHALTI_SANDBOX_BASE;

    // Khalti requires amount in paisa (NPR × 100)
    const amountPaisa = Math.round(Number(order.totalAmount) * 100);

    const res = await fetch(`${apiBase}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key ${secretKey}`,
      },
      body: JSON.stringify({
        return_url: `${frontendUrl}/checkout/khalti/verify`,
        website_url: frontendUrl,
        amount: amountPaisa,
        purchase_order_id: orderId,
        purchase_order_name: `Order #${orderId.slice(-8).toUpperCase()}`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new BadRequestException(err['detail'] ?? 'Khalti initiation failed');
    }

    const data = (await res.json()) as { pidx: string; payment_url: string; expires_at: string };

    await this.prisma.payment.upsert({
      where: { orderId },
      update: { externalId: data.pidx, provider: 'khalti' },
      create: {
        orderId,
        provider: 'khalti',
        amount: order.totalAmount,
        currency: 'NPR',
        status: 'UNPAID',
        externalId: data.pidx,
      },
    });

    return {
      pidx: data.pidx,
      paymentUrl: data.payment_url,
      expiresAt: data.expires_at,
    };
  }

  async verifyKhalti(pidx: string) {
    const secretKey = this.config.get<string>('KHALTI_SECRET_KEY')!;
    const apiBase = this.isProd ? KHALTI_PROD_BASE : KHALTI_SANDBOX_BASE;

    const res = await fetch(`${apiBase}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key ${secretKey}`,
      },
      body: JSON.stringify({ pidx }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new BadRequestException(err['detail'] ?? 'Khalti lookup failed');
    }

    const lookup = (await res.json()) as {
      pidx: string;
      status: string;
      transaction_id?: string;
      total_amount?: number;
    };

    if (lookup.status !== 'Completed') {
      throw new BadRequestException(`Khalti payment not completed: ${lookup.status}`);
    }

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: pidx, provider: 'khalti' },
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'PAID') return { success: true, orderId: payment.orderId };

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', refundId: lookup.transaction_id ?? null },
    });

    await this.ordersService.confirmPayment(payment.orderId);

    return { success: true, orderId: payment.orderId };
  }
}
