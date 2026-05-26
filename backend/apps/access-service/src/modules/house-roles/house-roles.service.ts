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

  /**
   * Идемпотентно пересоздаёт права доступа для всех системных ролей дома.
   * Вызывается после создания дома или при пересборке прав.
   */
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

  /**
   * Создаёт корневой ресурс HOUSE и функциональные дочерние ресурсы,
   * затем выставляет права: Owner/Admin → ALLOW (полный доступ),
   * Default → READ (только чтение). Идемпотентно.
   */
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

    // Создаём функциональные дочерние ресурсы для каждой зоны системы
    const functionalResources = [
      { type: ResourceType.ROOM,       name: 'Комнаты' },
      { type: ResourceType.DEVICE,     name: 'Устройства' },
      { type: ResourceType.SCENE,      name: 'Сценарии' },
      { type: ResourceType.AUTOMATION, name: 'Автоматизации' },
      { type: ResourceType.GROUP,      name: 'Виджеты' },
    ] as const;

    for (const res of functionalResources) {
      const existing = await this.prisma.resource.findFirst({
        where: { houseId, type: res.type, parentId: root.id },
      });
      if (!existing) {
        const created = await this.prisma.resource.create({
          data: { houseId, type: res.type, name: res.name, parentId: root.id, path: root.path, depth: 1 },
        });
        await this.prisma.resource.update({
          where: { id: created.id },
          data: { path: `${root.path}/${created.id}` },
        });
      }
    }

    // Owner и Admin → полный доступ (ALLOW) на корень (каскадируется на всех детей)
    for (const roleId of [ownerRoleId, adminRoleId]) {
      const exists = await this.prisma.accessRight.findFirst({
        where: { resourceId: root.id, roleId, accessRightType: AccessRightType.ALLOW },
      });
      if (!exists) {
        await this.prisma.accessRight.create({
          data: { resourceId: root.id, roleId, accessRightType: AccessRightType.ALLOW },
        });
      }
    }

    // Default → только чтение (READ) на корень
    const defaultExists = await this.prisma.accessRight.findFirst({
      where: { resourceId: root.id, roleId: defaultRoleId, accessRightType: AccessRightType.READ },
    });
    if (!defaultExists) {
      await this.prisma.accessRight.create({
        data: { resourceId: root.id, roleId: defaultRoleId, accessRightType: AccessRightType.READ },
      });
    }

    // Кэш effective permissions для участника-владельца
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

  /** Следующий свободный priority для кастомной роли в доме (уникален в паре houseId + priority). */
  async getNextAvailablePriority(houseId: string): Promise<number> {
    const agg = await this.prisma.houseRole.aggregate({
      where: { houseId },
      _max: { priority: true },
    });
    return (agg._max.priority ?? 0) + 1;
  }

  /** Может ли пользователь пригласить участника с указанной ролью (по приоритету — как при назначении роли). */
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

  /** Inviter может передать только те доменные права, которые сам имеет (владелец — все). */
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

