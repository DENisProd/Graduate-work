import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HouseMembersService } from '../house-members/house-members.service';
import { UserService } from '../../users/users.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import {
  BadRequestException,
  ForbiddenException,
  ResourceNotFoundException,
} from '../common/exceptions';
import { HouseAccessRightRequestDto } from './dto/house-access-right-request.dto';
import { AccessCheckRequestDto } from './dto/access-check-request.dto';
import { AccessCheckResponseDto, AccessRightDetailDto } from './dto/access-check-response.dto';
import { AccessRightType, ResourceType, Prisma } from '@prisma/client';

type RightWithRelations = Prisma.AccessRightGetPayload<{
  include: {
    resource: { include: { house: true } };
    houseMember: { include: { user: true } };
    role: true;
    grantedBy: true;
  };
}>;

const INCLUDE = {
  resource: { include: { house: true } },
  houseMember: { include: { user: true } },
  role: true,
  grantedBy: true,
} as const;

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly housesService: HousesService,
    private readonly houseMembersService: HouseMembersService,
    private readonly userService: UserService,
    private readonly houseRolesService: HouseRolesService,
  ) {}

  async createRight(dto: HouseAccessRightRequestDto, grantedByUserId: string): Promise<RightWithRelations> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: dto.resourceId },
      include: { house: true },
    });
    if (!resource) throw new ResourceNotFoundException('Ресурс', 'id', dto.resourceId);
    const houseId = resource.houseId;

    const hasMemberTarget = dto.houseMemberId != null;
    const hasRoleTarget = dto.houseRoleId != null;

    if (!hasMemberTarget && !hasRoleTarget) {
      throw new BadRequestException('Нужно указать либо houseMemberId, либо houseRoleId');
    }
    if (hasMemberTarget && hasRoleTarget) {
      throw new BadRequestException('Нельзя одновременно указывать houseMemberId и houseRoleId');
    }

    let memberId: string | undefined;
    let roleId: string | undefined;

    if (hasMemberTarget) {
      const member = await this.houseMembersService.findById(dto.houseMemberId!);
      if (member.houseId !== houseId) {
        throw new BadRequestException(`Участник с ID ${dto.houseMemberId} не принадлежит дому ${houseId}`);
      }
      memberId = member.id;
    } else if (hasRoleTarget) {
      const role = await this.prisma.houseRole.findUnique({ where: { id: dto.houseRoleId! } });
      if (!role) throw new ResourceNotFoundException('Роль дома', 'id', dto.houseRoleId!);
      if (role.houseId !== houseId) {
        throw new BadRequestException(`Роль с ID ${dto.houseRoleId} не принадлежит дому ${houseId}`);
      }
      roleId = role.id;
    }

    if (hasMemberTarget && memberId != null) {
      const canEdit = await this.houseRolesService.canEditMemberRights(houseId, grantedByUserId, memberId);
      if (!canEdit) throw new ForbiddenException('Недостаточно прав для выдачи доступа этому участнику');
    } else if (hasRoleTarget && roleId != null) {
      const canEdit = await this.houseRolesService.canEditRoleRights(houseId, grantedByUserId, roleId);
      if (!canEdit) throw new ForbiddenException('Недостаточно прав для выдачи доступа этой роли');
    }

    const grantedBy = await this.userService.findOrCreateByUserId(grantedByUserId);
    return this.prisma.accessRight.create({
      data: {
        resourceId: dto.resourceId,
        houseMemberId: memberId,
        roleId,
        accessRightType: dto.accessRightType,
        parameters: dto.parameters as Prisma.InputJsonValue ?? undefined,
        expiresAt: dto.expiresAt ?? undefined,
        grantedById: grantedBy.id,
      },
      include: INCLUDE,
    }) as Promise<RightWithRelations>;
  }

  async updateRight(id: string, dto: HouseAccessRightRequestDto, userId: string): Promise<RightWithRelations> {
    const right = await this.prisma.accessRight.findUnique({
      where: { id },
      include: INCLUDE,
    }) as RightWithRelations | null;
    if (!right) throw new ResourceNotFoundException('Право доступа', 'id', id);
    const houseId = right.resource.houseId;

    const canEdit = right.houseMemberId != null
      ? await this.houseRolesService.canEditMemberRights(houseId, userId, right.houseMemberId)
      : right.roleId != null
        ? await this.houseRolesService.canEditRoleRights(houseId, userId, right.roleId)
        : false;
    if (!canEdit) throw new ForbiddenException('Недостаточно прав для обновления этого права доступа');

    const hasMemberTarget = dto.houseMemberId != null;
    const hasRoleTarget = dto.houseRoleId != null;
    if (hasMemberTarget && hasRoleTarget) {
      throw new BadRequestException('Нельзя одновременно указывать houseMemberId и houseRoleId');
    }

    let targetUpdate: { houseMemberId?: string | null; roleId?: string | null } = {};

    if (hasMemberTarget) {
      const member = await this.houseMembersService.findById(dto.houseMemberId!);
      if (member.houseId !== houseId) throw new BadRequestException('Участник не принадлежит дому');
      targetUpdate = { houseMemberId: member.id, roleId: null };
    } else if (hasRoleTarget) {
      const role = await this.prisma.houseRole.findUnique({ where: { id: dto.houseRoleId! } });
      if (!role) throw new ResourceNotFoundException('Роль дома', 'id', dto.houseRoleId!);
      if (role.houseId !== houseId) throw new BadRequestException('Роль не принадлежит дому');
      targetUpdate = { houseMemberId: null, roleId: role.id };
    }

    return this.prisma.accessRight.update({
      where: { id },
      data: {
        accessRightType: dto.accessRightType,
        parameters: dto.parameters as Prisma.InputJsonValue ?? undefined,
        expiresAt: dto.expiresAt ?? undefined,
        ...targetUpdate,
      },
      include: INCLUDE,
    }) as Promise<RightWithRelations>;
  }

  async deleteRight(id: string, userId: string): Promise<void> {
    const right = await this.prisma.accessRight.findUnique({
      where: { id },
      include: { resource: { include: { house: true } } },
    });
    if (!right) throw new ResourceNotFoundException('Право доступа', 'id', id);
    const houseId = right.resource.houseId;

    const canEdit = right.houseMemberId != null
      ? await this.houseRolesService.canEditMemberRights(houseId, userId, right.houseMemberId)
      : right.roleId != null
        ? await this.houseRolesService.canEditRoleRights(houseId, userId, right.roleId)
        : false;
    if (!canEdit) throw new ForbiddenException('Недостаточно прав для удаления этого права доступа');
    await this.prisma.accessRight.delete({ where: { id } });
  }

  async findRightsByMemberId(memberId: string, page: number, size: number, sort: string): Promise<{ content: RightWithRelations[]; total: number }> {
    const member = await this.houseMembersService.findById(memberId);
    const roleIds = member.roles.map((r) => r.roleId);
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.AccessRightOrderByWithRelationInput;
    const targetCondition: Prisma.AccessRightWhereInput =
      roleIds.length > 0
        ? { OR: [{ houseMemberId: memberId }, { roleId: { in: roleIds } }] }
        : { houseMemberId: memberId };

    const [content, total] = await Promise.all([
      this.prisma.accessRight.findMany({
        where: targetCondition,
        include: INCLUDE,
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.accessRight.count({ where: targetCondition }),
    ]);
    return { content: content as RightWithRelations[], total };
  }

  async findRightsByHouseId(houseId: string, page: number, size: number, sort: string): Promise<{ content: RightWithRelations[]; total: number }> {
    const now = new Date();
    await this.housesService.findById(houseId);
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.AccessRightOrderByWithRelationInput;
    const where: Prisma.AccessRightWhereInput = {
      resource: { houseId },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
    const [content, total] = await Promise.all([
      this.prisma.accessRight.findMany({
        where,
        include: INCLUDE,
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.accessRight.count({ where }),
    ]);
    return { content: content as RightWithRelations[], total };
  }

  async checkAccess(dto: AccessCheckRequestDto): Promise<AccessCheckResponseDto> {
    const resource = await this.prisma.resource.findUnique({ where: { id: dto.resourceId } });
    if (!resource) throw new ResourceNotFoundException('Ресурс', 'id', dto.resourceId);

    const member = await this.houseMembersService.findByUserIdAndHouseId(dto.userId, resource.houseId);
    const roleIds = member.roles.map((r) => r.roleId);
    const now = new Date();

    const applicable: RightWithRelations[] = [];
    const seen = new Set<string>();

    const list = await this.prisma.accessRight.findMany({
      where: {
        AND: [
          {
            resourceId: dto.resourceId,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
          roleIds.length > 0
            ? { OR: [{ houseMemberId: member.id }, { roleId: { in: roleIds } }] }
            : { houseMemberId: member.id },
        ],
      },
      include: INCLUDE,
    });

    list.forEach((r) => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        applicable.push(r as RightWithRelations);
      }
    });

    if (applicable.length === 0) {
      return {
        hasAccess: false,
        effectiveRightType: undefined,
        applicableRights: [],
        reason: 'Нет настроенных прав доступа',
      };
    }

    const isExpired = (r: RightWithRelations) => r.expiresAt != null && r.expiresAt <= now;
    applicable.sort((a, b) => {
      const aDeny = a.accessRightType === AccessRightType.DENY ? 0 : 1;
      const bDeny = b.accessRightType === AccessRightType.DENY ? 0 : 1;
      return aDeny - bDeny;
    });

    for (const r of applicable) {
      if (r.accessRightType === AccessRightType.DENY) {
        return {
          hasAccess: false,
          effectiveRightType: 'DENY',
          applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
          reason: 'Доступ запрещен правилом DENY',
        };
      }
    }

    const operation = dto.operationType?.toLowerCase();
    const isRead = operation === 'read';
    const isWrite = operation === 'write';
    if (operation != null) {
      for (const r of applicable) {
        if (r.accessRightType === AccessRightType.READ && !isRead) {
          return {
            hasAccess: false,
            effectiveRightType: 'READ',
            applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
            reason: `Право READ не позволяет операцию ${operation}`,
          };
        }
        if (r.accessRightType === AccessRightType.WRITE && !isWrite) {
          return {
            hasAccess: false,
            effectiveRightType: 'WRITE',
            applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
            reason: `Право WRITE не позволяет операцию ${operation}`,
          };
        }
      }
    }

    const effective = applicable[0];
    const effectiveType = effective.accessRightType;
    const hasAccess =
      effectiveType === AccessRightType.ALLOW ||
      effectiveType === AccessRightType.READ ||
      effectiveType === AccessRightType.WRITE;
    return {
      hasAccess,
      effectiveRightType: effectiveType,
      applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
      reason: hasAccess ? 'Доступ разрешен' : 'Доступ запрещен',
    };
  }

  async cleanupExpiredRights(): Promise<void> {
    const now = new Date();
    await this.prisma.accessRight.deleteMany({
      where: { expiresAt: { not: null, lte: now } },
    });
  }
}

function toDetail(r: RightWithRelations, expired: boolean): AccessRightDetailDto {
  return {
    rightId: r.id,
    type: r.accessRightType,
    deviceId: r.resource.type === ResourceType.DEVICE ? r.resource.externalId ?? undefined : undefined,
    deviceFunctionId: r.resource.type === ResourceType.DEVICE_FUNCTION ? r.resource.externalId ?? undefined : undefined,
    houseRoomId: r.resource.type === ResourceType.ROOM ? r.resource.id : undefined,
    isExpired: expired,
  };
}


