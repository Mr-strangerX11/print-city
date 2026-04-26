import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateAddressDto {
  @IsString() label: string;
  @IsString() name: string;
  @IsString() phone: string;
  @IsString() address: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsOptional() @IsString() zip?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({
      data: { userId, ...dto, country: dto.country ?? 'Nepal' },
    });
  }

  async update(userId: string, id: string, dto: Partial<CreateAddressDto>) {
    const addr = await this.prisma.address.findUnique({ where: { id } });
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId !== userId) throw new ForbiddenException();
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async setDefault(userId: string, id: string) {
    const addr = await this.prisma.address.findUnique({ where: { id } });
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId !== userId) throw new ForbiddenException();
    await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return this.prisma.address.update({ where: { id }, data: { isDefault: true } });
  }

  async remove(userId: string, id: string) {
    const addr = await this.prisma.address.findUnique({ where: { id } });
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId !== userId) throw new ForbiddenException();
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }
}
