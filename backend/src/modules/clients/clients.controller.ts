import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { AuthorizeTransportDto } from './dto/authorize-transport.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create client' })
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clients' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/transport-types')
  @ApiOperation({ summary: 'Authorize transport type for the client' })
  authorizeTransport(
    @Param('id') id: string,
    @Body() dto: AuthorizeTransportDto,
  ) {
    return this.service.authorizeTransport(id, dto);
  }

  @Delete(':id/transport-types/:transportTypeId')
  @ApiOperation({ summary: 'Revoke transport authorization' })
  revokeTransport(
    @Param('id') id: string,
    @Param('transportTypeId') transportTypeId: string,
  ) {
    return this.service.revokeTransport(id, transportTypeId);
  }
}
