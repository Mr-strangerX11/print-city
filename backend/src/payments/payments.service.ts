import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';

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
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId.toString() !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    // We don't have line items from the embedded join — create a single summary line
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(order.totalAmount) * 100),
          product_data: { name: `Order #${orderId.slice(-8).toUpperCase()}` },
        },
        quantity: 1,
      },
    ];

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${this.config.get('FRONTEND_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/checkout/cancel?order_id=${orderId}`,
      metadata: { orderId, userId },
    });

    await this.paymentModel.findOneAndUpdate(
      { orderId: new Types.ObjectId(orderId) },
      { externalId: session.id, provider: 'stripe' },
      {
        upsert: true,
        new: true,
        setOnInsert: {
          orderId: new Types.ObjectId(orderId),
          provider: 'stripe',
          amount: order.totalAmount,
          currency: 'USD',
          status: 'UNPAID',
        },
      },
    );

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

      await this.paymentModel.findOneAndUpdate(
        { orderId: new Types.ObjectId(orderId) },
        { status: 'PAID', externalId: session.id },
      );
      await this.ordersService.confirmPayment(orderId);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.paymentModel.findOneAndUpdate(
        { externalId: intent.id },
        { status: 'FAILED' },
      );
    }

    return { received: true };
  }

  // ─── eSewa v2 ──────────────────────────────────────────────────────────────

  async initiateESewa(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId.toString() !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    const merchantCode = this.config.get<string>('ESEWA_MERCHANT_CODE')!;
    const secretKey = this.config.get<string>('ESEWA_SECRET_KEY')!;
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;

    const totalAmount = Number(order.totalAmount).toFixed(2);
    const transactionUuid = randomUUID();

    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`;
    const signature = createHmac('sha256', secretKey).update(message).digest('base64');

    await this.paymentModel.findOneAndUpdate(
      { orderId: new Types.ObjectId(orderId) },
      { externalId: transactionUuid, provider: 'esewa' },
      {
        upsert: true,
        new: true,
        setOnInsert: {
          orderId: new Types.ObjectId(orderId),
          provider: 'esewa',
          amount: order.totalAmount,
          currency: 'NPR',
          status: 'UNPAID',
        },
      },
    );

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

    const fields = (signed_field_names ?? 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names').split(',');
    const message = fields.map((f) => `${f}=${payload[f] ?? ''}`).join(',');
    const expected = createHmac('sha256', secretKey).update(message).digest('base64');

    if (expected !== signature) {
      throw new BadRequestException('eSewa signature mismatch');
    }

    const statusUrl = this.isProd ? ESEWA_STATUS_PROD : ESEWA_STATUS_SANDBOX;
    const params = new URLSearchParams({ product_code: merchantCode, total_amount, transaction_uuid });

    const statusRes = await fetch(`${statusUrl}?${params.toString()}`);
    if (!statusRes.ok) throw new BadRequestException('eSewa status API unreachable');

    const statusData = (await statusRes.json()) as { status: string; ref_id?: string };
    if (statusData.status !== 'COMPLETE') {
      throw new BadRequestException(`eSewa payment not complete: ${statusData.status}`);
    }

    const payment = await this.paymentModel.findOne({ externalId: transaction_uuid, provider: 'esewa' }).exec();
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'PAID') return { success: true, orderId: payment.orderId.toString() };

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      status: 'PAID',
      refundId: statusData.ref_id ?? null,
    });

    await this.ordersService.confirmPayment(payment.orderId.toString());

    return { success: true, orderId: payment.orderId.toString() };
  }

  // ─── Khalti v2 ─────────────────────────────────────────────────────────────

  async initiateKhalti(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId.toString() !== userId) throw new BadRequestException('Unauthorized');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Already paid');

    const secretKey = this.config.get<string>('KHALTI_SECRET_KEY')!;
    const frontendUrl = this.config.get<string>('FRONTEND_URL')!;
    const apiBase = this.isProd ? KHALTI_PROD_BASE : KHALTI_SANDBOX_BASE;

    const amountPaisa = Math.round(Number(order.totalAmount) * 100);

    const res = await fetch(`${apiBase}/epayment/initiate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `key ${secretKey}` },
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

    await this.paymentModel.findOneAndUpdate(
      { orderId: new Types.ObjectId(orderId) },
      { externalId: data.pidx, provider: 'khalti' },
      {
        upsert: true,
        new: true,
        setOnInsert: {
          orderId: new Types.ObjectId(orderId),
          provider: 'khalti',
          amount: order.totalAmount,
          currency: 'NPR',
          status: 'UNPAID',
        },
      },
    );

    return { pidx: data.pidx, paymentUrl: data.payment_url, expiresAt: data.expires_at };
  }

  async verifyKhalti(pidx: string) {
    const secretKey = this.config.get<string>('KHALTI_SECRET_KEY')!;
    const apiBase = this.isProd ? KHALTI_PROD_BASE : KHALTI_SANDBOX_BASE;

    const res = await fetch(`${apiBase}/epayment/lookup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `key ${secretKey}` },
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

    const payment = await this.paymentModel.findOne({ externalId: pidx, provider: 'khalti' }).exec();
    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.status === 'PAID') return { success: true, orderId: payment.orderId.toString() };

    await this.paymentModel.findByIdAndUpdate(payment._id, {
      status: 'PAID',
      refundId: lookup.transaction_id ?? null,
    });

    await this.ordersService.confirmPayment(payment.orderId.toString());

    return { success: true, orderId: payment.orderId.toString() };
  }
}
