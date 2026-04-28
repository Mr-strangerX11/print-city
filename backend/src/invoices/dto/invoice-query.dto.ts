import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { InvoiceStatus } from '../../common/enums';

export class InvoiceQueryDto {
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() limit?: string;
  @IsOptional() @IsEnum(InvoiceStatus) status?: InvoiceStatus;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}
