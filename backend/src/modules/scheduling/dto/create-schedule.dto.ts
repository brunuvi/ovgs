import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleDto {
  @ApiProperty({ example: '2026-07-01', description: 'Delivery date (ISO)' })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate!: string;

  @ApiProperty({ example: '08:00', description: 'Window start (HH:mm)' })
  @Matches(TIME_REGEX, { message: 'windowStart must be in HH:mm format' })
  windowStart!: string;

  @ApiProperty({ example: '12:00', description: 'Window end (HH:mm)' })
  @Matches(TIME_REGEX, { message: 'windowEnd must be in HH:mm format' })
  windowEnd!: string;
}
