import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ProductionService } from './production.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../user/schemas/user.schema';
import { PrintJobStatus, QCStatus, ShipmentStatus } from '../common/enums';

@Controller('production')
@Roles(Role.ADMIN)
export class ProductionController {
  constructor(private readonly production: ProductionService) {}

  // ── Print Jobs ─────────────────────────────────────────────────────────────
  @Post('print-jobs/:orderId')
  createPrintJob(@Param('orderId') orderId: string, @Body('notes') notes?: string) {
    return this.production.createPrintJob(orderId, notes);
  }

  @Get('print-jobs')
  listPrintJobs(@Query() query: any) { return this.production.listPrintJobs(query); }

  @Get('print-jobs/stats')
  printJobStats() { return this.production.getPrintJobStats(); }

  @Patch('print-jobs/:id/status')
  updatePrintJobStatus(@Param('id') id: string, @Body('status') status: PrintJobStatus, @Body('notes') notes?: string) {
    return this.production.updatePrintJobStatus(id, status, notes);
  }

  // ── Quality Control ────────────────────────────────────────────────────────
  @Post('qc/:printJobId')
  createQC(@Param('printJobId') printJobId: string) { return this.production.createQC(printJobId); }

  @Get('qc')
  listQCJobs(@Query() query: any) { return this.production.listQCJobs(query); }

  @Patch('qc/:id')
  updateQC(
    @Param('id') id: string,
    @Body('status') status: QCStatus,
    @Body('notes') notes?: string,
    @Body('images') images?: string[],
  ) { return this.production.updateQC(id, status, notes, images); }

  // ── Shipping ───────────────────────────────────────────────────────────────
  @Post('shipments/:orderId')
  createShipment(@Param('orderId') orderId: string, @Body() body: any) {
    return this.production.createShipment(orderId, body);
  }

  @Get('shipments')
  listShipments(@Query() query: any) { return this.production.listShipments(query); }

  @Patch('shipments/:id/status')
  updateShipmentStatus(@Param('id') id: string, @Body('status') status: ShipmentStatus, @Body('notes') notes?: string) {
    return this.production.updateShipmentStatus(id, status, notes);
  }
}
