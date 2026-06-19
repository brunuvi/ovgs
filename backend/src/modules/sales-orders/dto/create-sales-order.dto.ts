import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty({ description: 'ID of a previously registered item' })
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ description: 'Client ID' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ description: 'Transport type ID (must be authorized)' })
  @IsString()
  @IsNotEmpty()
  transportTypeId!: string;

  @ApiProperty({ type: [OrderItemInputDto], description: 'At least one item' })
  @IsArray()
  @ArrayMinSize(1, { message: 'A sales order must contain at least one item.' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
