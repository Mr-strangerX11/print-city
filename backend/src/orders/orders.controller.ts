import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrdersService, CheckoutDto, UpdateOrderStatusDto } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.ordersService.checkout(userId, dto);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.ordersService.getStats();
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role, @Query() query: any) {
    return this.ordersService.findAll(userId, role, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.ordersService.findOne(id, userId, role);
  }

  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.cancelOrder(id, userId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @CurrentUser('id') adminId: string) {
    return this.ordersService.updateStatus(id, dto.status, adminId);
  }
}
