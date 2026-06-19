import { PartialType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class RescheduleDto extends PartialType(CreateScheduleDto) {}
