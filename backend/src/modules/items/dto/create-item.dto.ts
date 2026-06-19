import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'SKU-005', description: 'Unique item identifier' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 'Pallet de Água Mineral 500ml' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'PLT', required: false, default: 'UN' })
  @IsOptional()
  @IsString()
  unit?: string;
}
