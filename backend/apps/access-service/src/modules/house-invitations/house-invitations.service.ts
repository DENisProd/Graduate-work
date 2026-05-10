import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HouseMembersService } from '../house-members/house-members.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import {
  ResourceNotFoundException,
  BadRequestException,
  ForbiddenException,
  DuplicateResourceException,
} from '../common/exceptions';
import { HouseInvitationRequestDto } from './dto/house-invitation-request.dto';
import { HouseInvitation, House, HouseMember, User, InvitationStatus, Prisma, HouseRole, HousePermission } from '@prisma/client';
import { randomUUID } from 'crypto';

type InvitationWithRelations = HouseInvitation & {
  house: House;
  invitedBy: (HouseMember & { user: User }) | null;
  role: (HouseRole & { permissions: { permission: HousePermission }[] }) | null;
};

const INCLUDE = {
  house: true,
  invitedBy: { include: { user: true } },
  role: { include: { permissions: true } },
} as const;

@Injectable()
export class HouseInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly housesService: HousesService,
    private readonly houseMembersService: HouseMembersService,
    private readonly houseRolesService: HouseRolesService,
  ) {}

  async create(dto: HouseInvitationRequestDto, invitedByUserId: string): Promise<InvitationWithRelations> {
    await this.housesService.findById(dto.houseId);
    const canInvite = await this.houseRolesService.canInviteMembers(dto.houseId, invitedByUserId);
    if (!canInvite) {
      throw new ForbiddenException('Недостаточно прав для приглашения участников (нужна роль Владелец или Админ)');
    }
    await this.houseMembersService.findByUserIdAndHouseId(invitedByUserId, dto.houseId);

    const now = new Date();

    const tokenHash = randomUUID();
    const expiresAt = dto.expiresAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inviter = await this.houseMembersService.findByUserIdAndHouseId(invitedByUserId, dto.houseId);

    if (dto.roleId && dto.permissions?.length) {
      throw new BadRequestException('Укажите либо roleId, либо permissions, но не оба');
    }
    if (dto.roleId) {
      const role = await this.houseRolesService.findById(dto.roleId);
      if (role.houseId !== dto.houseId) {
        throw new BadRequestException('Роль не принадлежит этому дому');
      }
      const can = await this.houseRolesService.canAssignRoleForInvitation(dto.houseId, invitedByUserId, dto.roleId);
      if (!can) {
        throw new ForbiddenException('Недостаточно прав, чтобы пригласить участника с этой ролью');
      }
    }
    if (dto.permissions?.length) {
      await this.houseRolesService.assertCanInviteWithPermissions(dto.houseId, invitedByUserId, dto.permissions);
    }

    const invitedPermissions =
      dto.roleId ? [] : [...new Set(dto.permissions ?? [])];

    return this.prisma.houseInvitation.create({
      data: {
        houseId: dto.houseId,
        note: dto.note?.trim() || null,
        tokenHash,
        roleId: dto.roleId ?? null,
        invitedPermissions,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedById: inviter.id,
      },
      include: INCLUDE,
    }) as Promise<InvitationWithRelations>;
  }

  async findByToken(token: string): Promise<InvitationWithRelations> {
    const inv = await this.prisma.houseInvitation.findFirst({
      where: { tokenHash: token },
      include: INCLUDE,
    });
    if (!inv) {
      throw new ResourceNotFoundException('Приглашение', 'token', token);
    }
    return inv as InvitationWithRelations;
  }

  async findById(id: string): Promise<InvitationWithRelations> {
    const inv = await this.prisma.houseInvitation.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!inv) {
      throw new ResourceNotFoundException('Приглашение', 'id', id);
    }
    return inv as InvitationWithRelations;
  }

  /**
   * Список приглашений дома.
   * По умолчанию — только активные ожидающие (PENDING и срок не истёк); принятые и прочие финальные статусы не попадают в выборку.
   * @param includeAll если true — полная история по дому без фильтра по статусу/сроку
   */
  async findByHouseId(
    houseId: string,
    page: number,
    size: number,
    sort: string,
    includeAll = false,
  ): Promise<{ content: InvitationWithRelations[]; total: number }> {
    await this.housesService.findById(houseId);
    const now = new Date();
    const where: Prisma.HouseInvitationWhereInput = includeAll
      ? { houseId }
      : {
          houseId,
          status: InvitationStatus.PENDING,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        };
    const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
    const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' } as Prisma.HouseInvitationOrderByWithRelationInput;
    const [content, total] = await Promise.all([
      this.prisma.houseInvitation.findMany({
        where,
        include: INCLUDE,
        skip: page * size,
        take: size,
        orderBy,
      }),
      this.prisma.houseInvitation.count({ where }),
    ]);
    return { content: content as InvitationWithRelations[], total };
  }

  async accept(token: string, userId: string): Promise<InvitationWithRelations> {
    const inv = await this.findByToken(token);
    if (inv.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже обработано');
    }
    if (inv.expiresAt && inv.expiresAt < new Date()) {
      await this.prisma.houseInvitation.update({
        where: { id: inv.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Приглашение истекло');
    }
    await this.houseMembersService.addMemberFromInvitation(inv.houseId, userId, {
      roleId: inv.roleId,
      invitedPermissions: inv.invitedPermissions?.length ? inv.invitedPermissions : undefined,
    });
    return this.prisma.houseInvitation.update({
      where: { id: inv.id },
      data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      include: INCLUDE,
    }) as Promise<InvitationWithRelations>;
  }

  async decline(token: string): Promise<InvitationWithRelations> {
    const inv = await this.findByToken(token);
    if (inv.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже обработано');
    }
    return this.prisma.houseInvitation.update({
      where: { id: inv.id },
      data: { status: InvitationStatus.DECLINED },
      include: INCLUDE,
    }) as Promise<InvitationWithRelations>;
  }

  async revoke(id: string, userId: string): Promise<InvitationWithRelations> {
    const inv = await this.findById(id);
    const canInvite = await this.houseRolesService.canInviteMembers(inv.houseId, userId);
    if (!canInvite) {
      throw new ForbiddenException('Недостаточно прав для отзыва приглашения (нужна роль Владелец или Админ)');
    }
    if (inv.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Можно отозвать только ожидающие приглашения');
    }
    return this.prisma.houseInvitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED },
      include: INCLUDE,
    }) as Promise<InvitationWithRelations>;
  }

  async cleanupExpired(): Promise<void> {
    const now = new Date();
    await this.prisma.houseInvitation.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  }
}

