import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

function toResponse(log: {
  id: string;
  actorId: string;
  action: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: Date;
}): AuditLogResponseDto {
  return {
    id: log.id,
    actorId: log.actorId,
    action: log.action,
    resourceId: log.resourceId ?? undefined,
    metadata: log.metadata as Record<string, unknown> | undefined,
    createdAt: log.createdAt.toISOString(),
  };
}

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Получить журнал аудита' })
  async findAll(
    @Query('actorId') actorId?: string,
    @Query('resourceId') resourceId?: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ): Promise<{ content: AuditLogResponseDto[]; total: number }> {
    const p = Math.max(0, parseInt(page ?? '0', 10) || 0);
    const s = Math.max(1, Math.min(100, parseInt(size ?? '20', 10) || 20));
    const { content, total } = await this.auditService.findAll({
      actorId,
      resourceId,
      action,
      page: p,
      size: s,
    });
    return { content: content.map(toResponse), total };
  }
}
