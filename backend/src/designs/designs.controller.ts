import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { memoryStorage } from 'multer';

import { Roles } from '../common/decorators/roles.decorator';
import { DesignsService } from './designs.service';
import { UploadDesignDto } from './dto/upload-design.dto';
import { QueryDesignsDto } from './dto/query-designs.dto';

@ApiTags('Designs')
@ApiBearerAuth()
@Controller('designs')
export class DesignsController {
  constructor(private readonly service: DesignsService) {}

  // ─── VENDOR ──────────────────────────────────────────────────────────────────

  @Post('upload')
  @Roles('VENDOR')
  @ApiOperation({ summary: 'Vendor: Upload a design file to private storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  uploadDesign(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDesignDto,
  ) {
    return this.service.upload(req.user.vendorProfile?.id ?? req.user.id, file, dto);
  }

  @Get('my')
  @Roles('VENDOR')
  @ApiOperation({ summary: 'Vendor: List own designs (no storage keys exposed)' })
  getMyDesigns(@Req() req: any, @Query() query: QueryDesignsDto) {
    return this.service.getVendorDesigns(req.user.vendorProfile?.id ?? req.user.id, query);
  }

  // ─── ADMIN ───────────────────────────────────────────────────────────────────

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: List all designs across vendors' })
  getAllDesigns(@Query() query: QueryDesignsDto) {
    return this.service.getAllDesigns(query);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: Approve or reject a design' })
  updateStatus(@Param('id') id: string, @Body('status') status: 'APPROVED' | 'REJECTED') {
    return this.service.updateStatus(id, status);
  }

  // ─── SHARED: Secure viewer token ─────────────────────────────────────────────

  @Post(':id/view-token')
  @Roles('ADMIN', 'VENDOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a one-time 60s view token for secure canvas rendering',
  })
  requestViewToken(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const ua = req.headers['user-agent'] ?? 'unknown';
    return this.service.requestViewToken(id, req.user.id, req.user.role, ip, ua);
  }

  @Post('render')
  @Roles('ADMIN', 'VENDOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange view token for watermarked base64 image (canvas rendering only)',
  })
  renderImage(@Body('token') token: string, @Req() req: any, @Res() res: Response) {
    return this.service.renderDisplayImage(token, req.user.id, req.user.role).then((result) => {
      // Aggressive cache prevention
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
        'X-Content-Type-Options': 'nosniff',
        // CSP: forbid displaying this response as an image resource
        'Content-Security-Policy': "default-src 'none'",
      });
      res.json(result);
    });
  }
}
