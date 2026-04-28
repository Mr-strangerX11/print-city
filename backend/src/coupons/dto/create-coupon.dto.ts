import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min, Max, IsInt } from 'class-validator';
import { CouponType } from '../../common/enums';

export class CreateCouponDto {
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(CouponType) type: CouponType;
  @IsNumber() @Min(0) value: number;
  @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
}

export class ValidateCouponDto {
  @IsString() code: string;
  @IsNumber() @Min(0) orderAmount: number;
}
