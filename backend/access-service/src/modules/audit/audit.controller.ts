import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { AuditListResponseDto } from './dto/audit-list-response.dto';

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
  @ApiOperation({
    summary: 'Журнал аудита',
    description: 'Фильтрация по субъекту, ресурсу и типу действия; пагинация `page`/`size` (size ≤ 100).',
  })
  @ApiQuery({ name: 'actorId', required: false, description: 'ID субъекта действия' })
  @ApiQuery({
    name: 'resourceId',
    required: false,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiQuery({ name: 'action', required: false, description: 'Код действия' })
  @ApiQuery({ name: 'page', required: false, example: '0' })
  @ApiQuery({ name: 'size', required: false, example: '20', description: 'Размер страницы, макс. 100' })
  @ApiOkResponse({ type: AuditListResponseDto })
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
