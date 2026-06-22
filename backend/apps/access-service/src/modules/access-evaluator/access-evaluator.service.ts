import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessRightType, EffectivePermission, AccessRight, AccessPolicy, ResourceType } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';
import { HouseMembersService } from 'src/modules/house-members/house-members.service';
import { HOUSE_PAGE_DEFINITIONS } from '../house-roles/house-pages.constants';

type Decision = {
  allowed: boolean;
  source: 'EFFECTIVE' | 'ACCESS_RIGHT' | 'POLICY' | 'NONE';
  rightType?: AccessRightType;
};

@Injectable()
export class AccessEvaluatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly usersService: UsersService,
    private readonly membersService: HouseMembersService,
  ) {}

  private actionAllowedByType(type: AccessRightType, action: 'READ' | 'WRITE'): boolean {
    if (type === AccessRightType.DENY) return false;
    if (type === AccessRightType.ALLOW) return true;
    if (type === AccessRightType.READ) return action === 'READ';
    if (type === AccessRightType.WRITE) return action === 'WRITE';
    return false;
  }

  private sortBySpecificity<T extends { resource: { depth: number }; accessRightType: AccessRightType }>(
    arr: T[],
  ): T[] {
    return [...arr].sort((a, b) => {
      if (a.resource.depth !== b.resource.depth) {
        return b.resource.depth - a.resource.depth;
      }
      const prio = (t: AccessRightType) =>
        t === AccessRightType.DENY ? 0 : t === AccessRightType.ALLOW ? 1 : 2;
      return prio(a.accessRightType) - prio(b.accessRightType);
    });
  }

  private decideFromList<T extends { accessRightType: AccessRightType }>(
    list: T[],
    action: 'READ' | 'WRITE',
  ): { allowed: boolean; type?: AccessRightType } {
    if (list.length === 0) return { allowed: false };
    for (const r of list) {
      if (r.accessRightType === AccessRightType.DENY) {
        return { allowed: false, type: r.accessRightType };
      }
    }
    for (const r of list) {
      if (this.actionAllowedByType(r.accessRightType, action)) {
        return { allowed: true, type: r.accessRightType };
      }
    }
    return { allowed: false };
  }

  async check(dto: AccessCheckDto & { userId: string }): Promise<Decision> {
    const resource = await this.resourcesService.findById(dto.resourceId);
    const user = await this.usersService.findByExternalUserId(dto.userId);

    const member = await this.prisma.houseMember.findFirst({
      where: { houseId: resource.houseId, userId: user.id },
      include: { roles: true },
    });
    if (!member) {
      return { allowed: false, source: 'NONE' };
    }

    const chain: string[] = [];
    let current = resource;
    while (current) {
      chain.push(current.id);
      if (!current.parentId) break;
      const parent = await this.prisma.resource.findUnique({ where: { id: current.parentId } });
      if (!parent) break;
      current = parent;
    }

    const eff: (EffectivePermission & { resource: { depth: number } })[] =
      await this.prisma.effectivePermission.findMany({
        where: {
          houseMemberId: member.id,
          resourceId: { in: chain },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { resource: { select: { depth: true } } },
      });

    const effSorted = this.sortBySpecificity(eff);
    const effDecision = this.decideFromList(effSorted, dto.action);
    if (effDecision.type) {
      return { allowed: effDecision.allowed, source: 'EFFECTIVE', rightType: effDecision.type };
    }

    const roleIds = member.roles.map((r) => r.roleId);
    const rights: (AccessRight & { resource: { depth: number } })[] =
      await this.prisma.accessRight.findMany({
        where: {
          AND: [
            {
              resourceId: { in: chain },
              OR: [
                { houseMemberId: member.id },
                ...(roleIds.length > 0 ? [{ roleId: { in: roleIds } }] : []),
              ],
            },
            { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          ],
        },
        include: { resource: { select: { depth: true } } },
      });

    const rightsSorted = this.sortBySpecificity(rights);
    const rightsDecision = this.decideFromList(rightsSorted, dto.action);
    if (rightsDecision.type) {
      return { allowed: rightsDecision.allowed, source: 'ACCESS_RIGHT', rightType: rightsDecision.type };
    }

    const policies: (AccessPolicy & { resource: { depth: number } | null })[] =
      await this.prisma.accessPolicy.findMany({
        where: {
          houseId: resource.houseId,
          OR: [
            { resourceId: null },
            { resourceId: { in: chain } },
          ],
        },
        include: { resource: { select: { depth: true } } },
      });

    const applicable = policies.filter((p) => {
      if (p.subjectId == null) return true;
      switch (p.subjectType) {
        case 'USER':
          return p.subjectId === user.id;
        case 'MEMBER':
          return p.subjectId === member.id;
        case 'ROLE':
          return member.roles.some((r) => r.roleId === p.subjectId);
        case 'ANYONE':
          return true;
        default:
          return false;
      }
    });

    applicable.sort((a, b) => a.priority - b.priority);
    if (applicable.length > 0) {
      const p = applicable[0];
      const allowed = this.actionAllowedByType(p.effect, dto.action);
      return { allowed, source: 'POLICY', rightType: p.effect };
    }

    return { allowed: false, source: 'NONE' };
  }

  async checkByDeviceFunction(dto: AccessCheckByDeviceDto & { userId: string }): Promise<{ allow: boolean; deny: boolean }> {
    const resource = await this.resourcesService.findDeviceFunctionByExternalOrId(dto.deviceFunctionId);
    const decision = await this.check({
      userId: dto.userId,
      resourceId: resource.id,
      action: dto.action,
    });
    return { allow: decision.allowed, deny: !decision.allowed };
  }

  async getPageAccess(
    houseId: string,
    userId: string,
  ): Promise<Record<string, { read: boolean; write: boolean }>> {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      include: { owner: { select: { externalUserId: true } } },
    });
    if (house?.owner?.externalUserId === userId) {
      return Object.fromEntries(
        HOUSE_PAGE_DEFINITIONS.map(({ slug }) => [slug, { read: true, write: true }]),
      );
    }

    const pages = await this.prisma.resource.findMany({
      where: { houseId, type: ResourceType.PAGE },
    });
    const bySlug = new Map(pages.map((p) => [p.externalId ?? '', p]));
    const result: Record<string, { read: boolean; write: boolean }> = {};

    for (const { slug } of HOUSE_PAGE_DEFINITIONS) {
      const resource = bySlug.get(slug);
      if (!resource) {
        result[slug] = { read: false, write: false };
        continue;
      }
      const [readDecision, writeDecision] = await Promise.all([
        this.check({ userId, resourceId: resource.id, action: 'READ' }),
        this.check({ userId, resourceId: resource.id, action: 'WRITE' }),
      ]);
      result[slug] = { read: readDecision.allowed, write: writeDecision.allowed };
    }

    return result;
  }

  async getFunctionAccess(
    houseId: string,
    userId: string,
  ): Promise<Record<string, { read: boolean; write: boolean }>> {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      include: { owner: { select: { externalUserId: true } } },
    });
    if (house?.owner?.externalUserId === userId) {
      const all = await this.prisma.resource.findMany({
        where: { houseId, type: ResourceType.DEVICE_FUNCTION },
        select: { externalId: true },
      });
      return Object.fromEntries(
        all
          .filter((r) => r.externalId)
          .map((r) => [r.externalId!, { read: true, write: true }]),
      );
    }

    const functions = await this.prisma.resource.findMany({
      where: { houseId, type: ResourceType.DEVICE_FUNCTION },
    });
    const result: Record<string, { read: boolean; write: boolean }> = {};

    for (const resource of functions) {
      const key = resource.externalId ?? resource.id;
      const [readDecision, writeDecision] = await Promise.all([
        this.check({ userId, resourceId: resource.id, action: 'READ' }),
        this.check({ userId, resourceId: resource.id, action: 'WRITE' }),
      ]);
      result[key] = { read: readDecision.allowed, write: writeDecision.allowed };
    }

    return result;
  }
}


