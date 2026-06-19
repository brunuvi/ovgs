import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTransportTypeDto } from './dto/create-transport-type.dto';
import { UpdateTransportTypeDto } from './dto/update-transport-type.dto';

@Injectable()
export class TransportTypesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTransportTypeDto) {
    return this.prisma.transportType.create({ data: dto });
  }

  findAll() {
    return this.prisma.transportType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const found = await this.prisma.transportType.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Transport type ${id} not found.`);
    }
    return found;
  }

  async update(id: string, dto: UpdateTransportTypeDto) {
    await this.findOne(id);
    return this.prisma.transportType.update({ where: { id }, data: dto });
  }
}
