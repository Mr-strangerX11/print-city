import { Controller, Post, Body, Param, Headers, RawBodyRequest, Req, UseGuards, Get, Query } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout/:orderId')
  createCheckout(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.createCheckoutSession(orderId, userId);
  }

  @Public()
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, sig);
  }

  // ─── eSewa ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('esewa/:orderId')
  initiateEsewa(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateESewa(orderId, userId);
  }

  /** Called by eSewa success redirect with ?data=<base64> */
  @Public()
  @Get('esewa/verify')
  verifyEsewa(@Query('data') data: string) {
    return this.paymentsService.verifyESewa(data);
  }

  // ─── Khalti ────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('khalti/:orderId')
  initiateKhalti(@Param('orderId') orderId: string, @CurrentUser('id') userId: string) {
    return this.paymentsService.initiateKhalti(orderId, userId);
  }

  /** Called by Khalti return_url redirect with ?pidx=<pidx> */
  @Public()
  @Post('khalti/verify')
  verifyKhalti(@Body('pidx') pidx: string) {
    return this.paymentsService.verifyKhalti(pidx);
  }
}
