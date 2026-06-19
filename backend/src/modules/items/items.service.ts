import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateItemDto) {
    return this.prisma.item.create({ data: dto });
  }

  findAll() {
    return this.prisma.item.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const found = await this.prisma.item.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Item ${id} not found.`);
    }
    return found;
  }
}
