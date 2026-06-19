import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { RescheduleDto } from './dto/reschedule.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@Controller('sales-orders/:id/schedule')
export class SchedulingController {
  constructor(private readonly service: SchedulingService) {}

  @Post()
  @ApiOperation({ summary: 'Set delivery date and time window' })
  create(@Param('id') id: string, @Body() dto: CreateScheduleDto) {
    return this.service.createOrReplace(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the sales order schedule' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch('confirm')
  @ApiOperation({ summary: 'Confirm schedule' })
  confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }

  @Patch('reschedule')
  @ApiOperation({ summary: 'Reschedule (invalidates the previous confirmation)' })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.service.reschedule(id, dto);
  }
}
