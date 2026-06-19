import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AUDIT_EVENT, AuditEventPayload } from './audit.events';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  emit(payload: AuditEventPayload): void {
    this.emitter.emit(AUDIT_EVENT, payload);
  }

  async record(payload: AuditEventPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        previousState: (payload.previousState ?? undefined) as Prisma.InputJsonValue,
        newState: (payload.newState ?? undefined) as Prisma.InputJsonValue,
        metadata: (payload.metadata ?? undefined) as Prisma.InputJsonValue,
      },
    });
  }

  findAll(filters: {
    entity?: string;
    entityId?: string;
    action?: AuditEventPayload['action'];
  }) {
    return this.prisma.auditLog.findMany({
      where: {
        entity: filters.entity,
        entityId: filters.entityId,
        action: filters.action,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
