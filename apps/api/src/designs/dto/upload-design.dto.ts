import { IsString, IsOptional, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDesignDto {
  @ApiProperty({ example: 'Summer Collection Logo' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'High-res logo for T-shirt front' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['logo', 'summer', 'tshirt'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
