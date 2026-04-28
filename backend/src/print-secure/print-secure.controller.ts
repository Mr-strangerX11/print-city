import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { Roles } from '../common/decorators/roles.decorator';
import { PrintSecureService } from './print-secure.service';
import { CreatePrintJobDto } from './dto/create-print-job.dto';

@ApiTags('Secure Print')
@ApiBearerAuth()
@Controller('print-secure')
export class PrintSecureController {
  constructor(private readonly service: PrintSecureService) {}

  @Post('jobs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Create a print job for a design' })
  createJob(@Req() req: any, @Body() dto: CreatePrintJobDto) {
    return this.service.createPrintJob(req.user.id, dto);
  }

  @Get('jobs/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Get print job status' })
  getJobStatus(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.service.getJobStatus(id, req.user.id);
  }

  @Post('jobs/:id/token')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Issue a one-time 30s print token' })
  issuePrintToken(@Param('id') id: string, @Req() req: any) {
    return this.service.issuePrintToken(id, req.user.id);
  }

  /**
   * Print endpoint — streams the PDF directly into a browser print dialog.
   * Headers prevent download / caching. Admin NEVER downloads the file.
   * Frontend opens this URL in a hidden iframe that auto-triggers window.print().
   */
  @Get('stream/:printToken')
  @ApiOperation({ summary: 'Stream print-ready PDF to browser print dialog (no download)' })
  async streamPdf(@Param('printToken') printToken: string, @Res() res: Response) {
    const { pdfBuffer, jobId, copies } = await this.service.streamPrintPdf(printToken);

    res.set({
      // Force inline rendering, NOT download
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="print.pdf"',
      'Content-Length': String(pdfBuffer.length),

      // No cache — print-and-done
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',

      // Block embedding outside the print iframe
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',

      // CSP: only allow printing, no saving
      'Content-Security-Policy':
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",

      // Custom headers for audit
      'X-Print-Job': jobId,
      'X-Print-Copies': String(copies),
    });

    res.send(pdfBuffer);
  }
}
