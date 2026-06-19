import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AUDIT_EVENT, AuditEventPayload } from './audit.events';
import { AuditService } from './audit.service';

@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent(AUDIT_EVENT, { async: true })
  async handle(payload: AuditEventPayload): Promise<void> {
    try {
      await this.auditService.record(payload);
    } catch (err) {
      this.logger.error(
        `Failed to record audit entry for ${payload.entity}:${payload.entityId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
