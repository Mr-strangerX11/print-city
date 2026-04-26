import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomDesignService, CreateCustomDesignDto, UpdateCustomDesignDto } from './custom-design.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('custom-design')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomDesignController {
  constructor(private svc: CustomDesignService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateCustomDesignDto) {
    return this.svc.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role, @Query() query: any) {
    return this.svc.findAll(userId, role, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.svc.findOne(id, userId, role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCustomDesignDto) {
    return this.svc.update(id, dto);
  }
}
