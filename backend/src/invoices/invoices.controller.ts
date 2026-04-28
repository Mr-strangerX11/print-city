import {
  Controller, Get, Post, Patch, Param, Query, Res,
  HttpCode, HttpStatus, StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, InvoiceStatus } from '@prisma/client';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  // ── Admin: manual re-generate ────────────────────────────────────────────
  @Post('generate/:orderId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  generate(@Param('orderId') orderId: string) {
    return this.invoices.generateForOrder(orderId);
  }

  // ── Admin stats ──────────────────────────────────────────────────────────
  @Get('stats')
  @Roles(Role.ADMIN)
  stats() {
    return this.invoices.getStats();
  }

  // ── List (role-filtered) ─────────────────────────────────────────────────
  @Get()
  findAll(@CurrentUser() user: any, @Query() query: InvoiceQueryDto) {
    return this.invoices.findAll(user.id, user.role, query);
  }

  // ── By order ID ──────────────────────────────────────────────────────────
  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    return this.invoices.findByOrder(orderId, user.id, user.role);
  }

  // ── Single invoice ───────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoices.findOne(id, user.id, user.role);
  }

  // ── Download PDF ─────────────────────────────────────────────────────────
  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.invoices.downloadPdf(id, user.id, user.role);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    return new StreamableFile(buffer);
  }

  // ── Update status (Admin) ────────────────────────────────────────────────
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Query('status') status: InvoiceStatus) {
    return this.invoices.updateStatus(id, status);
  }
}
