import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../user/schemas/user.schema';
import { VendorStatus } from '../common/enums';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private svc: VendorsService) {}

  @Public()
  @Get()
  findAll(@Query() query: any): Promise<any> { return this.svc.findAll(query); }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<any> { return this.svc.findBySlug(slug); }

  @Get('me/profile')
  @Roles(Role.VENDOR)
  getProfile(@CurrentUser('id') userId: string): Promise<any> { return this.svc.getProfile(userId); }

  @Patch('me/profile')
  @Roles(Role.VENDOR)
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.svc.updateProfile(userId, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: VendorStatus) {
    return this.svc.updateStatus(id, status);
  }

  @Patch(':id/commission')
  @Roles(Role.ADMIN)
  updateCommission(@Param('id') id: string, @Body('commissionRate') rate: number) {
    return this.svc.updateCommission(id, rate);
  }
}
