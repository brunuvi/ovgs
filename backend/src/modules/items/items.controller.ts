import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create item' })
  create(@Body() dto: CreateItemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List items' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
