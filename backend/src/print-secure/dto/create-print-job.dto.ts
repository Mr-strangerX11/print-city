import { IsString, IsEnum, IsInt, IsOptional, Min, Max, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DesignPrintFormat, DesignColorMode } from '../../common/enums';

export class CreatePrintJobDto {
  @ApiProperty()
  @IsString()
  designId: string;

  @ApiProperty({ enum: DesignPrintFormat })
  @IsEnum(DesignPrintFormat)
  format: DesignPrintFormat;

  @ApiPropertyOptional({ enum: DesignColorMode, default: 'RGB' })
  @IsOptional()
  @IsEnum(DesignColorMode)
  colorMode?: DesignColorMode = DesignColorMode.RGB;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  copies?: number = 1;

  @ApiPropertyOptional({ default: 300 })
  @IsOptional()
  @IsInt()
  @Min(150)
  @Max(600)
  dpi?: number = 300;

  @ApiPropertyOptional({ description: 'Bleed in mm', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bleed?: number = 3;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
