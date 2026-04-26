import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private svc: PayoutsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.VENDOR)
  findAll(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role, @Query() query: any) {
    return this.svc.findAll(userId, role, query);
  }

  @Get('earnings')
  @Roles(Role.VENDOR)
  earnings(@CurrentUser('id') userId: string) {
    return this.svc.getVendorEarnings(userId);
  }

  @Post('run')
  @Roles(Role.ADMIN)
  run(@Body() body: { periodStart: string; periodEnd: string }) {
    return this.svc.runPayouts(body.periodStart, body.periodEnd);
  }

  @Patch(':id/paid')
  @Roles(Role.ADMIN)
  markPaid(@Param('id') id: string) {
    return this.svc.markPaid(id);
  }
}
