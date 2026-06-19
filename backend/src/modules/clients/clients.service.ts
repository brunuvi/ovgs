import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthorizeTransportDto } from './dto/authorize-transport.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const { authorizedTransportTypeIds, ...data } = dto;
    return this.prisma.client.create({
      data: {
        ...data,
        authorizedTransports: authorizedTransportTypeIds
          ? {
              create: authorizedTransportTypeIds.map((transportTypeId) => ({
                transportTypeId,
              })),
            }
          : undefined,
      },
      include: this.includeTransports(),
    });
  }

  findAll() {
    return this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: this.includeTransports(),
    });
  }

  async findOne(id: string) {
    const found = await this.prisma.client.findUnique({
      where: { id },
      include: this.includeTransports(),
    });
    if (!found) {
      throw new NotFoundException(`Client ${id} not found.`);
    }
    return found;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    const { authorizedTransportTypeIds, ...data } = dto;

    if (authorizedTransportTypeIds) {
      await this.prisma.clientTransportType.deleteMany({
        where: { clientId: id },
      });
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...data,
        authorizedTransports: authorizedTransportTypeIds
          ? {
              create: authorizedTransportTypeIds.map((transportTypeId) => ({
                transportTypeId,
              })),
            }
          : undefined,
      },
      include: this.includeTransports(),
    });
  }

  async authorizeTransport(id: string, dto: AuthorizeTransportDto) {
    await this.findOne(id);
    await this.prisma.clientTransportType.upsert({
      where: {
        clientId_transportTypeId: {
          clientId: id,
          transportTypeId: dto.transportTypeId,
        },
      },
      update: {},
      create: { clientId: id, transportTypeId: dto.transportTypeId },
    });
    return this.findOne(id);
  }

  async revokeTransport(id: string, transportTypeId: string) {
    await this.findOne(id);
    await this.prisma.clientTransportType.deleteMany({
      where: { clientId: id, transportTypeId },
    });
    return this.findOne(id);
  }

  async isTransportAuthorized(
    clientId: string,
    transportTypeId: string,
  ): Promise<boolean> {
    const link = await this.prisma.clientTransportType.findUnique({
      where: {
        clientId_transportTypeId: { clientId, transportTypeId },
      },
    });
    return link !== null;
  }

  private includeTransports() {
    return {
      authorizedTransports: { include: { transportType: true } },
    };
  }
}
