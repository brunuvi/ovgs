import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeTransportDto } from './dto/change-transport.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SalesOrdersService } from './sales-orders.service';

@ApiTags('sales-orders')
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create sales order' })
  create(@Body() dto: CreateSalesOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List/monitor sales orders (filters: status, client, transport, date)',
  })
  findAll(@Query() query: QuerySalesOrderDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order details' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status (valid transitions only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Patch(':id/transport')
  @ApiOperation({ summary: 'Change the order transport type' })
  changeTransport(@Param('id') id: string, @Body() dto: ChangeTransportDto) {
    return this.service.changeTransport(id, dto.transportTypeId);
  }
}
