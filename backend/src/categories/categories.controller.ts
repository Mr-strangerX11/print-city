import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService, CreateCategoryDto } from './categories.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private svc: CategoriesService) {}

  @Public()
  @Get()
  findAll() { return this.svc.findAll(); }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) { return this.svc.findOne(slug); }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoryDto) { return this.svc.create(dto); }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
