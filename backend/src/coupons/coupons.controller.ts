import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../user/schemas/user.schema';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  // ── Admin routes ──────────────────────────────────────────────────────────
  @Post() @Roles(Role.ADMIN)
  create(@Body() dto: CreateCouponDto) { return this.coupons.create(dto); }

  @Get() @Roles(Role.ADMIN)
  findAll(@Query() query: any): Promise<any> { return this.coupons.findAll(query); }

  @Get('stats') @Roles(Role.ADMIN)
  stats() { return this.coupons.getStats(); }

  @Get(':id') @Roles(Role.ADMIN)
  findOne(@Param('id') id: string): Promise<any> { return this.coupons.findOne(id); }

  @Patch(':id') @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateCouponDto>) { return this.coupons.update(id, dto); }

  @Delete(':id') @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.coupons.remove(id); }

  // ── Customer: validate code ───────────────────────────────────────────────
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateCouponDto, @CurrentUser() user: any) {
    return this.coupons.validate(dto, user.id);
  }
}
