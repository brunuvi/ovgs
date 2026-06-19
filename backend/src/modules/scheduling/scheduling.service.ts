import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { STATUS_FLOW } from '../sales-orders/domain/order-state-machine';
import { SalesOrdersService } from '../sales-orders/sales-orders.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { RescheduleDto } from './dto/reschedule.dto';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly salesOrders: SalesOrdersService,
  ) {}

  async createOrReplace(orderId: string, dto: CreateScheduleDto) {
    await this.ensureOrder(orderId);
    this.validateWindow(dto.windowStart, dto.windowEnd);

    const previous = await this.prisma.schedule.findUnique({
      where: { salesOrderId: orderId },
    });

    const data = {
      deliveryDate: new Date(dto.deliveryDate),
      windowStart: dto.windowStart,
      windowEnd: dto.windowEnd,
      confirmed: false,
    };

    const schedule = await this.prisma.schedule.upsert({
      where: { salesOrderId: orderId },
      update: data,
      create: { salesOrderId: orderId, ...data },
    });

    this.emitAudit(orderId, previous, schedule, 'create');
    return schedule;
  }

  async reschedule(orderId: string, dto: RescheduleDto) {
    const previous = await this.getScheduleOrThrow(orderId);

    const windowStart = dto.windowStart ?? previous.windowStart;
    const windowEnd = dto.windowEnd ?? previous.windowEnd;
    this.validateWindow(windowStart, windowEnd);

    const schedule = await this.prisma.schedule.update({
      where: { salesOrderId: orderId },
      data: {
        deliveryDate: dto.deliveryDate
          ? new Date(dto.deliveryDate)
          : previous.deliveryDate,
        windowStart,
        windowEnd,
        confirmed: false,
      },
    });

    this.emitAudit(orderId, previous, schedule, 'reschedule');
    return schedule;
  }

  async confirm(orderId: string) {
    const previous = await this.getScheduleOrThrow(orderId);
    if (previous.confirmed) {
      return previous;
    }
    const schedule = await this.prisma.schedule.update({
      where: { salesOrderId: orderId },
      data: { confirmed: true },
    });

    this.emitAudit(orderId, previous, schedule, 'confirm');
    await this.advanceToScheduledIfPossible(orderId);
    return schedule;
  }

  // Walks the order forward one valid step at a time up to AGENDADA, never past
  // it. So confirming a schedule takes a CRIADA or PLANEJADA order to AGENDADA.
  private async advanceToScheduledIfPossible(orderId: string) {
    const targetIdx = STATUS_FLOW.indexOf(OrderStatus.AGENDADA);
    for (;;) {
      const order = await this.prisma.salesOrder.findUnique({
        where: { id: orderId },
        select: { status: true },
      });
      if (!order) break;
      const currentIdx = STATUS_FLOW.indexOf(order.status);
      if (currentIdx < 0 || currentIdx >= targetIdx) break;
      await this.salesOrders.updateStatus(orderId, STATUS_FLOW[currentIdx + 1]);
    }
  }

  get(orderId: string) {
    return this.getScheduleOrThrow(orderId);
  }

  private async ensureOrder(orderId: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException(`Sales order ${orderId} not found.`);
    }
  }

  private async getScheduleOrThrow(orderId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { salesOrderId: orderId },
    });
    if (!schedule) {
      throw new NotFoundException(
        `No schedule found for sales order ${orderId}.`,
      );
    }
    return schedule;
  }

  private validateWindow(start: string, end: string) {
    if (start >= end) {
      throw new BadRequestException(
        'Invalid delivery window: start must be before end.',
      );
    }
  }

  private emitAudit(
    orderId: string,
    previous: unknown,
    next: unknown,
    op: string,
  ) {
    this.audit.emit({
      action: AuditAction.SCHEDULE_CHANGED,
      entity: 'Schedule',
      entityId: orderId,
      previousState: previous as Record<string, unknown> | null,
      newState: next as Record<string, unknown>,
      metadata: { operation: op },
    });
  }
}
