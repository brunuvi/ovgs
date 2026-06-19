import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query the audit trail' })
  findAll(
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
  ) {
    return this.auditService.findAll({ entity, entityId, action });
  }
}
