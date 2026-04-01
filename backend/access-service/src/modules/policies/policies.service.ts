import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessPolicy } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { ResourceNotFoundException } from '../common/exceptions';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { AuditService, AUDIT_ACTIONS } from '../audit/audit.service';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePolicyDto, actorId?: string): Promise<AccessPolicy> {
    const resource = await this.resourcesService.findById(dto.resourceId);

    const policy = await this.prisma.accessPolicy.create({
      data: {
        houseId: resource.houseId,
        name: dto.name,
        effect: dto.effect,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        resourceId: resource.id,
        condition: dto.condition as any,
        priority: dto.priority,
      },
    });

    await this.auditService.log(actorId ?? 'system', AUDIT_ACTIONS.POLICY_CREATED, policy.id, {
      houseId: resource.houseId,
      policyName: policy.name,
    });

    return policy;
  }

  async findByHouseId(houseId: string): Promise<AccessPolicy[]> {
    return this.prisma.accessPolicy.findMany({
      where: { houseId },
      orderBy: { priority: 'asc' },
    });
  }

  async delete(id: string): Promise<void> {
    const policy = await this.prisma.accessPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new ResourceNotFoundException('Политика доступа', 'id', id);
    }
    await this.prisma.accessPolicy.delete({ where: { id } });
  }
}


