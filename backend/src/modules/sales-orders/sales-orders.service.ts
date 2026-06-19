import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import {
  InvalidStatusTransitionError,
  OrderStateMachine,
} from './domain/order-state-machine';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';

const ORDER_INCLUDE = {
  client: true,
  transportType: true,
  items: { include: { item: true } },
  schedule: true,
} satisfies Prisma.SalesOrderInclude;

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSalesOrderDto) {
    const client = await this.clients.findOne(dto.clientId);
    if (!client.active) {
      throw new BadRequestException('An inactive client cannot create sales orders.');
    }

    const authorized = await this.clients.isTransportAuthorized(
      dto.clientId,
      dto.transportTypeId,
    );
    if (!authorized) {
      throw new BadRequestException(
        'The given transport type is not authorized for this client.',
      );
    }

    const itemIds = dto.items.map((i) => i.itemId);
    const existing = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((i) => i.id));
    const missing = itemIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unregistered items: ${missing.join(', ')}.`,
      );
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const count = await tx.salesOrder.count();
      const code = `OV-${String(count + 1).padStart(4, '0')}`;
      return tx.salesOrder.create({
        data: {
          code,
          clientId: dto.clientId,
          transportTypeId: dto.transportTypeId,
          status: OrderStatus.CRIADA,
          items: {
            create: dto.items.map((i) => ({
              itemId: i.itemId,
              quantity: i.quantity,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });
    });

    this.audit.emit({
      action: AuditAction.ORDER_CREATED,
      entity: 'SalesOrder',
      entityId: order.id,
      newState: { status: order.status, code: order.code },
      metadata: { clientId: order.clientId, transportTypeId: order.transportTypeId },
    });

    return order;
  }

  findAll(query: QuerySalesOrderDto) {
    const where: Prisma.SalesOrderWhereInput = {
      status: query.status,
      clientId: query.clientId,
      transportTypeId: query.transportTypeId,
    };

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      };
    }

    return this.prisma.salesOrder.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException(`Sales order ${id} not found.`);
    }
    return order;
  }

  async updateStatus(id: string, target: OrderStatus) {
    const order = await this.findOne(id);
    const from = order.status;

    try {
      OrderStateMachine.assertTransition(from, target);
    } catch (err) {
      if (err instanceof InvalidStatusTransitionError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    if (target === OrderStatus.AGENDADA && !order.schedule?.confirmed) {
      throw new BadRequestException(
        'Moving to AGENDADA requires a confirmed schedule.',
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: target },
      include: ORDER_INCLUDE,
    });

    this.audit.emit({
      action: AuditAction.STATUS_CHANGED,
      entity: 'SalesOrder',
      entityId: id,
      previousState: { status: from },
      newState: { status: target },
    });

    return updated;
  }

  async changeTransport(id: string, transportTypeId: string) {
    const order = await this.findOne(id);

    if (
      order.status === OrderStatus.EM_TRANSPORTE ||
      order.status === OrderStatus.ENTREGUE
    ) {
      throw new ForbiddenException(
        'Cannot change the transport of an order that is in transit or delivered.',
      );
    }

    const authorized = await this.clients.isTransportAuthorized(
      order.clientId,
      transportTypeId,
    );
    if (!authorized) {
      throw new BadRequestException(
        'The given transport type is not authorized for this client.',
      );
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { transportTypeId },
      include: ORDER_INCLUDE,
    });

    this.audit.emit({
      action: AuditAction.TRANSPORT_CHANGED,
      entity: 'SalesOrder',
      entityId: id,
      previousState: { transportTypeId: order.transportTypeId },
      newState: { transportTypeId },
    });

    return updated;
  }
}
