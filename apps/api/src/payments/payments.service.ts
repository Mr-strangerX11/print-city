import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

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

  // eSewa placeholder
  async initiateESewa(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    return {
      message: 'eSewa integration placeholder',
      merchantCode: this.config.get('ESEWA_MERCHANT_CODE'),
      amount: order.totalAmount,
      orderId,
    };
  }

  // Khalti placeholder
  async initiateKhalti(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    return {
      message: 'Khalti integration placeholder',
      publicKey: this.config.get('KHALTI_PUBLIC_KEY'),
      amount: order.totalAmount,
      orderId,
    };
  }
}
