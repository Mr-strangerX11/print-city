import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomOrderStatus, Role } from '@prisma/client';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCustomDesignDto {
  @IsString() productType: string;
  @IsString() designUrl: string;
  @IsOptional() @IsString() publicId?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(1) qty?: number;
}

export class UpdateCustomDesignDto {
  @IsOptional() status?: CustomOrderStatus;
  @IsOptional() @IsString() adminNotes?: string;
  @IsOptional() price?: number;
}

@Injectable()
export class CustomDesignService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCustomDesignDto) {
    return this.prisma.customDesignOrder.create({
      data: {
        userId,
        productType: dto.productType,
        designUrl: dto.designUrl,
        publicId: dto.publicId,
        notes: dto.notes,
        size: dto.size,
        color: dto.color,
        qty: dto.qty ?? 1,
        status: CustomOrderStatus.PENDING,
      },
    });
  }

  async findAll(userId: string, role: Role, query: any) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role === Role.CUSTOMER) where.userId = userId;
    if (query.status) where.status = query.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customDesignOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.customDesignOrder.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: Role) {
    const order = await this.prisma.customDesignOrder.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!order) throw new NotFoundException('Custom design order not found');
    if (role === Role.CUSTOMER && order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async update(id: string, dto: UpdateCustomDesignDto) {
    const order = await this.prisma.customDesignOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    return this.prisma.customDesignOrder.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
        ...(dto.price !== undefined && { price: dto.price }),
      },
    });
  }
}
