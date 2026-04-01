import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessRight, AccessRightType, PermissionSourceType, ResourceType } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';
import { BadRequestException, ResourceNotFoundException } from '../common/exceptions';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { AuditService, AUDIT_ACTIONS } from '../audit/audit.service';
import { AccessStructureResponseDto, HouseStructureDto, RoomNodeDto, DeviceNodeDto, DeviceFunctionNodeDto } from './dto/access-structure-response.dto';
import { ResourceTreeNodeDto } from '../resources/dto/resource-tree-node.dto';
import { HouseRolesService } from 'src/modules/house-roles/house-roles.service';
import { HouseMembersService } from 'src/modules/house-members/house-members.service';

type AccessRightWithResource = AccessRight & {
  resource: {
    type: ResourceType;
    depth: number;
  };
};

@Injectable()
export class PermissionsService {
  private readonly accessRightWithResourceInclude = {
    resource: {
      select: {
        type: true,
        depth: true,
      },
    },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly resourcesService: ResourcesService,
    private readonly membersService: HouseMembersService,
    private readonly rolesService: HouseRolesService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAccessRightDto, grantedByExternalUserId: string): Promise<AccessRight> {
    const resource = await this.resourcesService.findById(dto.resourceId);

    const hasMember = !!dto.houseMemberId;
    const hasRole = !!dto.roleId;
    if (!hasMember && !hasRole) {
      throw new BadRequestException('Нужно указать либо houseMemberId, либо roleId');
    }
    if (hasMember && hasRole) {
      throw new BadRequestException('Нельзя одновременно указывать houseMemberId и roleId');
    }

    let houseMemberId: string | undefined;
    let roleId: string | undefined;

    if (dto.houseMemberId) {
      const member = await this.membersService.findById(dto.houseMemberId);
      if (member.houseId !== resource.houseId) {
        throw new BadRequestException('Участник не принадлежит дому ресурса');
      }
      houseMemberId = member.id;
    }

    if (dto.roleId) {
      const role = await this.rolesService.findById(dto.roleId);
      if (role.houseId !== resource.houseId) {
        throw new BadRequestException('Роль не принадлежит дому ресурса');
      }
      roleId = role.id;
    }

    const grantedBy = await this.usersService.findOrCreateByExternalUserId(grantedByExternalUserId);

    const right = await this.prisma.accessRight.create({
      data: {
        resourceId: resource.id,
        houseMemberId,
        roleId,
        accessRightType: dto.accessRightType,
        expiresAt: dto.expiresAt ?? null,
        grantedById: grantedBy.id,
      },
    });

    // Простейший триггер кэша: прямое право для участника -> пишем в EffectivePermission.
    if (houseMemberId) {
      await this.prisma.effectivePermission.upsert({
        where: {
          houseMemberId_resourceId_accessRightType: {
            houseMemberId,
            resourceId: resource.id,
            accessRightType: dto.accessRightType,
          },
        },
        create: {
          houseMemberId,
          resourceId: resource.id,
          accessRightType: dto.accessRightType,
          sourceType: PermissionSourceType.DIRECT,
          sourceId: right.id,
          expiresAt: dto.expiresAt ?? null,
        },
        update: {
          sourceType: PermissionSourceType.DIRECT,
          sourceId: right.id,
          expiresAt: dto.expiresAt ?? null,
        },
      });
    }

    await this.auditService.log(grantedByExternalUserId, AUDIT_ACTIONS.ACCESS_GRANTED, right.id, {
      resourceId: resource.id,
      houseMemberId: houseMemberId ?? undefined,
      roleId: roleId ?? undefined,
    });

    return right;
  }

  async findById(id: string): Promise<AccessRight> {
    const right = await this.prisma.accessRight.findUnique({ where: { id } });
    if (!right) {
      throw new ResourceNotFoundException('Право доступа', 'id', id);
    }
    return right;
  }

  async delete(id: string): Promise<void> {
    const right = await this.findById(id);

    if (right.houseMemberId) {
      await this.prisma.effectivePermission.deleteMany({
        where: {
          houseMemberId: right.houseMemberId,
          resourceId: right.resourceId,
          accessRightType: right.accessRightType,
          sourceType: PermissionSourceType.DIRECT,
          sourceId: right.id,
        },
      });
    }

    await this.prisma.accessRight.delete({ where: { id } });
  }

  async findByResourceId(resourceId: string): Promise<AccessRightWithResource[]> {
    await this.resourcesService.findById(resourceId);
    return this.prisma.accessRight.findMany({
      where: {
        resourceId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: this.accessRightWithResourceInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Права пользователя (по внешнему ID): прямые и через роли. Просроченные исключаются. */
  async findByUserId(externalUserId: string): Promise<AccessRightWithResource[]> {
    const user = await this.usersService.findOrCreateByExternalUserId(externalUserId);
    const members = await this.prisma.houseMember.findMany({
      where: { userId: user.id, removedAt: null },
      include: { roles: { select: { roleId: true } } },
    });
    const memberIds = members.map((m) => m.id);
    const roleIds = members.flatMap((m) => m.roles.map((r) => r.roleId));
    if (memberIds.length === 0 && roleIds.length === 0) {
      return [];
    }
    const now = new Date();
    return this.prisma.accessRight.findMany({
      where: {
        AND: [
          {
            OR: [
              ...(memberIds.length > 0 ? [{ houseMemberId: { in: memberIds } }] : []),
              ...(roleIds.length > 0 ? [{ roleId: { in: roleIds } }] : []),
            ],
          },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
      include: this.accessRightWithResourceInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async rebuildCache(): Promise<void> {
    await this.prisma.effectivePermission.deleteMany({});

    const rights = await this.prisma.accessRight.findMany({
      where: { houseMemberId: { not: null } },
    });

    for (const r of rights) {
      await this.prisma.effectivePermission.upsert({
        where: {
          houseMemberId_resourceId_accessRightType: {
            houseMemberId: r.houseMemberId!,
            resourceId: r.resourceId,
            accessRightType: r.accessRightType,
          },
        },
        create: {
          houseMemberId: r.houseMemberId!,
          resourceId: r.resourceId,
          accessRightType: r.accessRightType,
          sourceType: PermissionSourceType.DIRECT,
          sourceId: r.id,
          expiresAt: r.expiresAt,
        },
        update: {
          sourceType: PermissionSourceType.DIRECT,
          sourceId: r.id,
          expiresAt: r.expiresAt,
        },
      });
    }
  }

  /** Структура доступа пользователя: дома, комнаты, устройства, функции (по правам). */
  async getAccessStructure(externalUserId: string): Promise<AccessStructureResponseDto> {
    const rights = await this.findByUserId(externalUserId);
    const allowedIds = new Set(rights.map((r) => r.resourceId));
    if (allowedIds.size === 0) {
      return { houses: [] };
    }
    const resources = await this.prisma.resource.findMany({
      where: { id: { in: Array.from(allowedIds) } },
    });
    const houseIds = [...new Set(resources.map((r) => r.houseId))];
    const houses = await this.prisma.house.findMany({
      where: { id: { in: houseIds } },
      select: { id: true, name: true },
    });
    const houseMap = new Map(houses.map((h) => [h.id, h]));

    const result: HouseStructureDto[] = [];

    for (const houseId of houseIds) {
      const tree = await this.resourcesService.getTreeByHouseId(houseId);
      const hasAllowedDescendant = (node: ResourceTreeNodeDto): boolean => {
        if (allowedIds.has(node.id)) return true;
        for (const ch of node.children) {
          if (hasAllowedDescendant(ch)) return true;
        }
        return false;
      };
      const filterTree = (nodes: ResourceTreeNodeDto[]): ResourceTreeNodeDto[] => {
        return nodes
          .filter((n) => hasAllowedDescendant(n))
          .map((n) => ({
            ...n,
            children: filterTree(n.children),
          }));
      };
      const filtered = filterTree(tree);
      const toRoom = (n: ResourceTreeNodeDto): RoomNodeDto => ({
        id: n.id,
        name: n.name,
        externalId: n.externalId,
        devices: n.children.filter((c) => c.type === 'DEVICE').map(toDevice),
      });
      const toDevice = (n: ResourceTreeNodeDto): DeviceNodeDto => ({
        id: n.id,
        externalId: n.externalId,
        functions: n.children.filter((c) => c.type === 'DEVICE_FUNCTION').map(toFunc),
      });
      const toFunc = (n: ResourceTreeNodeDto): DeviceFunctionNodeDto => ({
        id: n.id,
        externalId: n.externalId,
      });
      const houseRoot = filtered.find((r) => r.type === 'HOUSE') ?? filtered[0];
      const rooms = houseRoot ? houseRoot.children.filter((c) => c.type === 'ROOM').map(toRoom) : [];
      const house = houseMap.get(houseId);
      result.push({
        id: houseId,
        name: house?.name ?? houseId,
        rooms,
      });
    }

    return { houses: result };
  }
}


