import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional } from 'class-validator';
import slugify from 'slugify';

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() parentId?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { children: true, _count: { select: { products: true } } },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, products: { take: 20, where: { status: 'ACTIVE' } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.category.create({
      data: { name: dto.name, slug, image: dto.image, parentId: dto.parentId },
    });
  }

  async update(id: string, dto: Partial<CreateCategoryDto & { description?: string }>) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException();
    const data: Record<string, any> = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (Object.keys(data).length === 0) return cat;
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
