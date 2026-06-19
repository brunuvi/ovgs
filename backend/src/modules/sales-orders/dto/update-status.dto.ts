import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Desired new status' })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
