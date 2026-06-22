import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../users/users.service';
import { HousesService } from '../houses/houses.service';
import { ResourceNotFoundException, DuplicateResourceException } from '../common/exceptions';
import {
  HouseMember,
  User,
  House,
  HouseMemberRole,
  HouseRole,
  HousePermission,
  Prisma,
  EffectivePermission,
  Resource,
} from '@prisma/client';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { RightWithRelations } from '../access-control/access-control.mapper';

export type MemberWithUserAndHouse = HouseMember & {
  user: User;
  house: House;
  roles: (HouseMemberRole & {
    role: HouseRole & {
      permissions: { permission: HousePermission }[];
      _count: { accessRights: number };
    };
  })[];
};

const MEMBER_WITH_ROLES_INCLUDE = {
  user: true,
  house: true,
  roles: {
    include: {
      role: {
        include: {
          permissions: true,
          _count: { select: { accessRights: true } },
        },
      },
    },
  },
} as const;

export type MemberWithAccessDetails = {
  member: MemberWithUserAndHouse;
  effective: (EffectivePermission & { resource: Resource })[];
  directRights: RightWithRelations[];
};

@Injectable()
export class HouseMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly housesService: HousesService,
    private readonly houseRolesService: HouseRolesService,
  ) {}

  async findById(id: string): Promise<MemberWithUserAndHouse> {
    const member = await this.prisma.houseMember.findUnique({
      where: { id },
      include: MEMBER_WITH_ROLES_INCLUDE,
    });
    if (!member) {
      throw new ResourceNotFoundException('Участник дома', 'id', id);
    }
    return member as MemberWithUserAndHouse;
  }

  async findByIdWithAccessDetails(id: string): Promise<MemberWithAccessDetails> {
    const now = new Date();
    const [member, effective, directRights] = await Promise.all([
      this.prisma.houseMember.findUnique({
        where: { id },
        include: MEMBER_WITH_ROLES_INCLUDE,
      }),
      this.prisma.effectivePermission.findMany({
        where: {
          houseMemberId: id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        include: { resource: true },
        orderBy: { resource: { path: 'asc' } },
      }),
      this.prisma.accessRight.findMany({
        where: {
          houseMemberId: id,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        include: {
          resource: { include: { house: true } },
          houseMember: { include: { user: true } },
          role: true,
          grantedBy: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    if (!member) {
      throw new ResourceNotFoundException('Участник дома', 'id', id);
    }
    return {
      member: member as MemberWithUserAndHouse,
      effective,
      directRights: directRights as RightWithRelations[],
    };
  }

  async findByUserIdAndHouseId(userId: string, houseId: string): Promise<MemberWithUserAndHouse> {
    const user = await this.userService.findByUserId(userId);
    const member = await this.prisma.houseMember.findFirst({
      where: { userId: user.id, houseId, removedAt: null },
      include: MEMBER_WITH_ROLES_INCLUDE,
    });
    if (!member) {
      throw new ResourceNotFoundException('Участник дома', 'userId и houseId', `${userId}, ${houseId}`);
    }
    return member as MemberWithUserAndHouse;
  }

  async isMember(userId: string, houseId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({ where: { externalUserId: userId } });
    if (!user) return false;
    const count = await this.prisma.houseMember.count({
      where: { userId: user.id, houseId, removedAt: null },
    });
    return count > 0;
  }

  async findByHouseId(houseId: string, page: number, size: number, sort: string): Promise<{ content: MemberWithUserAndHouse[]; total: number }> {
    await this.housesService.findById(houseId);
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['joinedAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.HouseMemberOrderByWithRelationInput;
    const [content, total] = await Promise.all([
      this.prisma.houseMember.findMany({
        where: { houseId, removedAt: null },
        include: MEMBER_WITH_ROLES_INCLUDE,
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.houseMember.count({ where: { houseId, removedAt: null } }),
    ]);
    return { content: content as MemberWithUserAndHouse[], total };
  }

  async addMember(houseId: string, userId: string): Promise<MemberWithUserAndHouse> {
    return this.addMemberFromInvitation(houseId, userId, {});
  }

  async addMemberFromInvitation(
    houseId: string,
    userId: string,
    invite: { roleId?: string | null; invitedPermissions?: HousePermission[] },
  ): Promise<MemberWithUserAndHouse> {
    await this.housesService.findById(houseId);
    const user = await this.userService.findOrCreateByUserId(userId);
    const existing = await this.prisma.houseMember.findFirst({
      where: { userId: user.id, houseId, removedAt: null },
    });
    if (existing) {
      throw new DuplicateResourceException('Участник дома', 'userId и houseId', `${userId}, ${houseId}`);
    }
    const member = await this.prisma.houseMember.create({
      data: { userId: user.id, houseId },
    });

    const perms = invite.invitedPermissions ?? [];
    if (invite.roleId) {
      await this.prisma.houseMemberRole.create({
        data: { houseMemberId: member.id, roleId: invite.roleId },
      });
    } else if (perms.length > 0) {
      const priority = await this.houseRolesService.getNextAvailablePriority(houseId);
      const role = await this.prisma.houseRole.create({
        data: {
          houseId,
          name: `Приглашение ${member.id.slice(0, 8)}`,
          priority,
          isSystem: false,
          permissions: {
            create: [...new Set(perms)].map((permission) => ({ permission })),
          },
        },
      });
      await this.prisma.houseMemberRole.create({
        data: { houseMemberId: member.id, roleId: role.id },
      });
    } else {
      const defaultRole = await this.houseRolesService.getDefaultRoleForHouse(houseId);
      await this.prisma.houseMemberRole.create({
        data: { houseMemberId: member.id, roleId: defaultRole.id },
      });
    }
    return this.findById(member.id);
  }

  async removeMember(houseId: string, userId: string): Promise<void> {
    await this.housesService.findById(houseId);
    const user = await this.userService.findByUserId(userId);
    const member = await this.prisma.houseMember.findFirst({
      where: { userId: user.id, houseId, removedAt: null },
      select: { id: true },
    });
    if (!member) {
      return;
    }
    const id = member.id;
    await this.prisma.$transaction(async (tx) => {
      await tx.houseMemberRole.deleteMany({ where: { houseMemberId: id } });
      await tx.effectivePermission.deleteMany({ where: { houseMemberId: id } });
      await tx.accessRight.deleteMany({ where: { houseMemberId: id } });
      await tx.houseMember.delete({ where: { id } });
    });
  }

  async findHousesByUserId(userId: string, page: number, size: number, sort: string): Promise<{ content: any[]; total: number }> {
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.HouseOrderByWithRelationInput;
    const where = { members: { some: { user: { externalUserId: userId }, removedAt: null } } };
    const [content, total] = await Promise.all([
      this.prisma.house.findMany({
        where,
        include: { owner: true },
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.house.count({ where }),
    ]);
    return { content, total };
  }
}


