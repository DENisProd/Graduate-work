import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessAuditLog } from '@prisma/client';

export const AUDIT_ACTIONS = {
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_DELETED: 'ROLE_DELETED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  POLICY_CREATED: 'POLICY_CREATED',
  INVITATION_CREATED: 'INVITATION_CREATED',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',
} as const;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    actorId: string,
    action: string,
    resourceId?: string | null,
    metadata?: Record<string, unknown> | null,
  ): Promise<AccessAuditLog> {
    return this.prisma.accessAuditLog.create({
      data: {
        actorId,
        action,
        resourceId: resourceId ?? undefined,
        metadata: metadata as object ?? undefined,
      },
    });
  }

  async findAll(params: {
    actorId?: string;
    resourceId?: string;
    action?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: AccessAuditLog[]; total: number }> {
    const { actorId, resourceId, action, page = 0, size = 20 } = params;
    const where: { actorId?: string; resourceId?: string; action?: string } = {};
    if (actorId) where.actorId = actorId;
    if (resourceId) where.resourceId = resourceId;
    if (action) where.action = action;

    const [content, total] = await Promise.all([
      this.prisma.accessAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page * size,
        take: size,
      }),
      this.prisma.accessAuditLog.count({ where }),
    ]);
    return { content, total };
  }
}
