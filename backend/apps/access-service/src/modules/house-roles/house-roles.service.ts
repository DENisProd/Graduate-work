import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { HousesService } from '../houses/houses.service';
import { ResourceNotFoundException, ForbiddenException, BadRequestException } from '../common/exceptions';
import {
  AccessRightType,
  HousePermission,
  PermissionSourceType,
  ResourceType,
} from '@prisma/client';
import { SYSTEM_ROLE_NAMES, SYSTEM_ROLE_PRIORITIES, SYSTEM_ROLE_PERMISSIONS } from './constants';
import { DEFAULT_READ_PAGE_SLUGS, HOUSE_PAGE_DEFINITIONS } from './house-pages.constants';

function housesServiceRef() {
  const { HousesService } =
    require('../houses/houses.service') as typeof import('../houses/houses.service');
  return HousesService;
}

@Injectable()
export class HouseRolesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(housesServiceRef))
    private readonly housesService: HousesService,
  ) {}

  async createDefaultRolesForHouse(houseId: string, ownerMemberId: string): Promise<void> {
    await this.housesService.findById(houseId);

    const roleNames = [SYSTEM_ROLE_NAMES.OWNER, SYSTEM_ROLE_NAMES.ADMIN, SYSTEM_ROLE_NAMES.DEFAULT] as const;
    let ownerRoleId: string | undefined;
    let adminRoleId: string | undefined;
    let defaultRoleId: string | undefined;

    for (const name of roleNames) {
      const priority = SYSTEM_ROLE_PRIORITIES[name];
      const permissions = SYSTEM_ROLE_PERMISSIONS[name] ?? [];
      const role = await this.prisma.houseRole.create({
        data: {
          name,
          houseId,
          priority,
          isSystem: true,
          permissions: {
            create: permissions.map((permission) => ({ permission })),
          },
        },
      });
      if (name === SYSTEM_ROLE_NAMES.OWNER) {
        ownerRoleId = role.id;
        await this.prisma.houseMemberRole.create({
          data: { houseMemberId: ownerMemberId, roleId: role.id },
        });
      }
      if (name === SYSTEM_ROLE_NAMES.ADMIN) adminRoleId = role.id;
      if (name === SYSTEM_ROLE_NAMES.DEFAULT) defaultRoleId = role.id;
    }

    if (ownerRoleId && adminRoleId && defaultRoleId) {
      await this.setupHouseResourceAccess(houseId, ownerMemberId, ownerRoleId, adminRoleId, defaultRoleId);
    }
  }

  async ensureOwnerFullAccessForHouse(houseId: string): Promise<void> {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      select: { ownerId: true },
    });
    if (!house?.ownerId) return;

    const ownerMember = await this.prisma.houseMember.findFirst({
      where: { houseId, userId: house.ownerId, removedAt: null },
    });
    if (!ownerMember) return;

    const [ownerRole, adminRole, defaultRole] = await Promise.all([
      this.prisma.houseRole.findFirst({ where: { houseId, name: SYSTEM_ROLE_NAMES.OWNER } }),
      this.prisma.houseRole.findFirst({ where: { houseId, name: SYSTEM_ROLE_NAMES.ADMIN } }),
      this.prisma.houseRole.findFirst({ where: { houseId, name: SYSTEM_ROLE_NAMES.DEFAULT } }),
    ]);
    if (!ownerRole || !adminRole || !defaultRole) return;

    await this.setupHouseResourceAccess(houseId, ownerMember.id, ownerRole.id, adminRole.id, defaultRole.id);
  }

  private async setupHouseResourceAccess(
    houseId: string,
    ownerMemberId: string,
    ownerRoleId: string,
    adminRoleId: string,
    defaultRoleId: string,
  ): Promise<void> {
    let root = await this.prisma.resource.findFirst({
      where: { houseId, type: ResourceType.HOUSE, parentId: null },
    });
    if (!root) {
      root = await this.prisma.resource.create({
        data: { houseId, type: ResourceType.HOUSE, path: `/${houseId}`, depth: 0 },
      });
    }

    const functionalResources = [
      { type: ResourceType.ROOM,       name: 'Комнаты' },
      { type: ResourceType.DEVICE,     name: 'Устройства' },
      { type: ResourceType.SCENE,      name: 'Сценарии' },
      { type: ResourceType.AUTOMATION, name: 'Автоматизации' },
      { type: ResourceType.GROUP,      name: 'Виджеты' },
    ] as const;

    for (const res of functionalResources) {
      await this.ensureChildResource(root, {
        houseId,
        type: res.type,
        name: res.name,
      });
    }

    for (const page of HOUSE_PAGE_DEFINITIONS) {
      const pageResource = await this.ensureChildResource(root, {
        houseId,
        type: ResourceType.PAGE,
        name: page.name,
        externalId: page.slug,
      });

      for (const roleId of [ownerRoleId, adminRoleId]) {
        await this.ensureRoleAccessRight(pageResource.id, roleId, AccessRightType.ALLOW);
      }

      if ((DEFAULT_READ_PAGE_SLUGS as readonly string[]).includes(page.slug)) {
        await this.ensureRoleAccessRight(pageResource.id, defaultRoleId, AccessRightType.READ);
      }
    }

    for (const roleId of [ownerRoleId, adminRoleId]) {
      await this.ensureRoleAccessRight(root.id, roleId, AccessRightType.ALLOW);
    }

    await this.ensureRoleAccessRight(root.id, defaultRoleId, AccessRightType.READ);

    const ownerRight = await this.prisma.accessRight.findFirst({
      where: { resourceId: root.id, roleId: ownerRoleId, accessRightType: AccessRightType.ALLOW },
    });
    if (ownerRight) {
      await this.prisma.effectivePermission.upsert({
        where: {
          houseMemberId_resourceId_accessRightType: {
            houseMemberId: ownerMemberId,
            resourceId: root.id,
            accessRightType: AccessRightType.ALLOW,
          },
        },
        create: {
          houseMemberId: ownerMemberId,
          resourceId: root.id,
          accessRightType: AccessRightType.ALLOW,
          sourceType: PermissionSourceType.ROLE,
          sourceId: ownerRight.id,
        },
        update: {
          sourceType: PermissionSourceType.ROLE,
          sourceId: ownerRight.id,
        },
      });
    }
  }

  private async ensureChildResource(
    parent: { id: string; path: string; depth: number },
    data: {
      houseId: string;
      type: ResourceType;
      name: string;
      externalId?: string;
    },
  ) {
    const existing = await this.prisma.resource.findFirst({
      where: {
        houseId: data.houseId,
        type: data.type,
        ...(data.externalId != null
          ? { externalId: data.externalId }
          : { parentId: parent.id, name: data.name }),
      },
    });
    if (existing) return existing;

    const created = await this.prisma.resource.create({
      data: {
        houseId: data.houseId,
        type: data.type,
        name: data.name,
        externalId: data.externalId,
        parentId: parent.id,
        path: parent.path,
        depth: parent.depth + 1,
      },
    });
    return this.prisma.resource.update({
      where: { id: created.id },
      data: { path: `${parent.path}/${created.id}` },
    });
  }

  private async ensureRoleAccessRight(
    resourceId: string,
    roleId: string,
    accessRightType: AccessRightType,
  ): Promise<void> {
    const exists = await this.prisma.accessRight.findFirst({
      where: { resourceId, roleId, accessRightType },
    });
    if (!exists) {
      await this.prisma.accessRight.create({
        data: { resourceId, roleId, accessRightType },
      });
    }
  }

  async getRoleByHouseAndName(houseId: string, name: string) {
    const role = await this.prisma.houseRole.findFirst({
      where: { houseId, name },
      include: { permissions: true },
    });
    if (!role) {
      throw new ResourceNotFoundException('Роль дома', 'name', name);
    }
    return role;
  }

  async getDefaultRoleForHouse(houseId: string) {
    return this.getRoleByHouseAndName(houseId, SYSTEM_ROLE_NAMES.DEFAULT);
  }

  async getNextAvailablePriority(houseId: string): Promise<number> {
    const agg = await this.prisma.houseRole.aggregate({
      where: { houseId },
      _max: { priority: true },
    });
    return (agg._max.priority ?? 0) + 1;
  }

  async canAssignRoleForInvitation(houseId: string, inviterUserId: string, roleId: string): Promise<boolean> {
    const isOwner = await this.housesService.isOwner(houseId, inviterUserId);
    if (isOwner) return true;
    const role = await this.findById(roleId);
    if (role.houseId !== houseId) return false;
    const inviterMember = await this.prisma.houseMember.findFirst({
      where: { houseId, user: { externalUserId: inviterUserId }, removedAt: null },
    });
    if (!inviterMember) return false;
    const inviterPriority = await this.getMemberBestPriority(houseId, inviterMember.id);
    return inviterPriority < role.priority;
  }

  async assertCanInviteWithPermissions(houseId: string, inviterUserId: string, permissions: HousePermission[]): Promise<void> {
    if (permissions.length === 0) return;
    const isOwner = await this.housesService.isOwner(houseId, inviterUserId);
    if (isOwner) return;
    for (const p of permissions) {
      const ok = await this.hasPermission(houseId, inviterUserId, p);
      if (!ok) {
        throw new ForbiddenException(`Недостаточно прав, чтобы передать приглашённому право: ${p}`);
      }
    }
  }

  async getMemberBestPriority(houseId: string, memberId: string): Promise<number> {
    const member = await this.prisma.houseMember.findFirst({
      where: { id: memberId, houseId },
      include: { roles: { include: { role: true } } },
    });
    if (!member || member.roles.length === 0) return 9999;
    return Math.min(...member.roles.map((r) => r.role.priority));
  }

  async hasPermission(houseId: string, userId: string, permission: HousePermission): Promise<boolean> {
    const member = await this.prisma.houseMember.findFirst({
      where: { houseId, user: { externalUserId: userId } },
      include: { roles: { include: { role: { include: { permissions: true } } } } },
    });
    if (!member) return false;
    return member.roles.some((mr) => mr.role.permissions.some((p) => p.permission === permission));
  }

  async canEditMemberRights(houseId: string, editorUserId: string, targetMemberId: string): Promise<boolean> {
    const isOwner = await this.housesService.isOwner(houseId, editorUserId);
    if (isOwner) return true;

    const hasEdit = await this.hasPermission(houseId, editorUserId, HousePermission.EDIT_ROLES);
    if (!hasEdit) return false;

    const editorMember = await this.prisma.houseMember.findFirst({
      where: { houseId, user: { externalUserId: editorUserId } },
    });
    if (!editorMember) return false;

    const editorPriority = await this.getMemberBestPriority(houseId, editorMember.id);
    const targetPriority = await this.getMemberBestPriority(houseId, targetMemberId);
    return editorPriority < targetPriority;
  }

  async canInviteMembers(houseId: string, userId: string): Promise<boolean> {
    const isOwner = await this.housesService.isOwner(houseId, userId);
    if (isOwner) return true;
    return this.hasPermission(houseId, userId, HousePermission.INVITE_MEMBERS);
  }

  async canEditRoleRights(houseId: string, editorUserId: string, roleId: string): Promise<boolean> {
    const isOwner = await this.housesService.isOwner(houseId, editorUserId);
    if (isOwner) return true;
    const hasEdit = await this.hasPermission(houseId, editorUserId, HousePermission.EDIT_ROLES);
    if (!hasEdit) return false;
    const role = await this.findById(roleId);
    if (role.houseId !== houseId) return false;
    const editorMember = await this.prisma.houseMember.findFirst({
      where: { houseId, user: { externalUserId: editorUserId } },
    });
    if (!editorMember) return false;
    const editorPriority = await this.getMemberBestPriority(houseId, editorMember.id);
    return editorPriority < role.priority;
  }

  async findById(roleId: string) {
    const role = await this.prisma.houseRole.findUnique({
      where: { id: roleId },
      include: { house: true, permissions: true },
    });
    if (!role) {
      throw new ResourceNotFoundException('Роль дома', 'id', roleId);
    }
    return role;
  }

  async findByHouseId(houseId: string) {
    await this.housesService.findById(houseId);
    return this.prisma.houseRole.findMany({
      where: { houseId },
      include: { permissions: true },
      orderBy: { priority: 'asc' },
    });
  }

  async createCustomRole(houseId: string, name: string, priority: number, editorUserId: string) {
    await this.housesService.findById(houseId);
    const canEdit = await this.hasPermission(houseId, editorUserId, HousePermission.EDIT_ROLES)
      || (await this.housesService.isOwner(houseId, editorUserId));
    if (!canEdit) {
      throw new ForbiddenException('Только Владелец или Админ могут создавать кастомные роли');
    }
    const existing = await this.prisma.houseRole.findFirst({ where: { houseId, name } });
    if (existing) {
      throw new BadRequestException(`Роль с именем «${name}» уже существует в этом доме`);
    }
    return this.prisma.houseRole.create({
      data: { houseId, name, priority, isSystem: false },
      include: { permissions: true },
    });
  }

  async deleteRole(roleId: string): Promise<void> {
    const role = await this.findById(roleId);
    if (role.isSystem) {
      throw new ForbiddenException('Системные роли (Владелец, Админ, По умолчанию) удалять нельзя');
    }
    await this.prisma.houseRole.delete({ where: { id: roleId } });
  }

  async assignRoleToMember(memberId: string, roleId: string, editorUserId: string): Promise<void> {
    const member = await this.prisma.houseMember.findUnique({
      where: { id: memberId },
      include: { house: true },
    });
    if (!member) throw new ResourceNotFoundException('Участник дома', 'id', memberId);
    const role = await this.findById(roleId);
    if (role.houseId !== member.houseId) {
      throw new BadRequestException('Роль не принадлежит дому участника');
    }
    const canEdit = await this.canEditMemberRights(member.houseId, editorUserId, memberId);
    if (!canEdit) {
      throw new ForbiddenException('Недостаточно прав для назначения этой роли');
    }
    const editorMember = await this.prisma.houseMember.findFirst({
      where: { houseId: member.houseId, user: { externalUserId: editorUserId } },
    });
    if (!editorMember) throw new ForbiddenException('Вы не являетесь участником этого дома');
    const editorPriority = await this.getMemberBestPriority(member.houseId, editorMember.id);
    if (role.priority <= editorPriority) {
      throw new ForbiddenException('Нельзя назначить роль выше или равную своей');
    }
    await this.prisma.houseMemberRole.upsert({
      where: { houseMemberId_roleId: { houseMemberId: memberId, roleId } },
      update: {},
      create: { houseMemberId: memberId, roleId },
    });
  }

  async unassignRoleFromMember(memberId: string, roleId: string, editorUserId: string): Promise<void> {
    const member = await this.prisma.houseMember.findUnique({
      where: { id: memberId },
      include: { house: true },
    });
    if (!member) throw new ResourceNotFoundException('Участник дома', 'id', memberId);
    const role = await this.findById(roleId);
    if (role.houseId !== member.houseId) {
      throw new BadRequestException('Роль не принадлежит дому участника');
    }
    if (role.isSystem) {
      throw new ForbiddenException('Системную роль нельзя снять с участника через этот метод');
    }
    const canEdit = await this.canEditMemberRights(member.houseId, editorUserId, memberId);
    if (!canEdit) {
      throw new ForbiddenException('Недостаточно прав для снятия роли');
    }
    await this.prisma.houseMemberRole.delete({
      where: { houseMemberId_roleId: { houseMemberId: memberId, roleId } },
    });
  }
}

