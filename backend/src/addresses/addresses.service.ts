import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Address, AddressDocument } from './schemas/address.schema';

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
  constructor(@InjectModel(Address.name) private addressModel: Model<AddressDocument>) {}

  async list(userId: string) {
    return this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async create(userId: string, dto: CreateAddressDto) {
    const uid = new Types.ObjectId(userId);
    if (dto.isDefault) {
      await this.addressModel.updateMany({ userId: uid }, { isDefault: false });
    }
    const addr = new this.addressModel({
      userId: uid,
      ...dto,
      country: dto.country ?? 'Nepal',
    });
    return addr.save();
  }

  async update(userId: string, id: string, dto: Partial<CreateAddressDto>) {
    const addr = await this.addressModel.findById(id).exec();
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId.toString() !== userId) throw new ForbiddenException();
    if (dto.isDefault) {
      await this.addressModel.updateMany({ userId: addr.userId }, { isDefault: false });
    }
    Object.assign(addr, dto);
    return addr.save();
  }

  async setDefault(userId: string, id: string) {
    const addr = await this.addressModel.findById(id).exec();
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId.toString() !== userId) throw new ForbiddenException();
    await this.addressModel.updateMany({ userId: addr.userId }, { isDefault: false });
    addr.isDefault = true;
    return addr.save();
  }

  async remove(userId: string, id: string) {
    const addr = await this.addressModel.findById(id).exec();
    if (!addr) throw new NotFoundException('Address not found');
    if (addr.userId.toString() !== userId) throw new ForbiddenException();
    await this.addressModel.findByIdAndDelete(id);
    return { deleted: true };
  }
}
