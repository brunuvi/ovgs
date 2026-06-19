import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTransportTypeDto } from './dto/create-transport-type.dto';
import { UpdateTransportTypeDto } from './dto/update-transport-type.dto';
import { TransportTypesService } from './transport-types.service';

@ApiTags('transport-types')
@Controller('transport-types')
export class TransportTypesController {
  constructor(private readonly service: TransportTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create transport type' })
  create(@Body() dto: CreateTransportTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transport types' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transport type' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transport type' })
  update(@Param('id') id: string, @Body() dto: UpdateTransportTypeDto) {
    return this.service.update(id, dto);
  }
}
