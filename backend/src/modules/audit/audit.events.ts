import { AuditAction } from '@prisma/client';

export const AUDIT_EVENT = 'audit.record';

export interface AuditEventPayload {
  action: AuditAction;
  entity: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}
