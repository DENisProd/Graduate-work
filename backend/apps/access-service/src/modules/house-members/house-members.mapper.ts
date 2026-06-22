import {
  EffectivePermission,
  HouseMemberRole,
  HousePermission,
  HouseRole,
  Resource,
} from '@prisma/client';
import {
  HouseMemberDetailResponseDto,
  HouseMemberListItemDto,
  HouseMemberResponseDto,
  HouseMemberRoleBriefDto,
  MemberEffectivePermissionDto,
} from './dto/house-member-response.dto';
import { toHouseAccessRightResponse, RightWithRelations } from '../access-control/access-control.mapper';
import type { MemberWithUserAndHouse, MemberWithAccessDetails } from './house-members.service';

type MemberWithUserAndHouseMapper = {
  id: string;
  houseId: string;
  joinedAt: Date;
  user: { externalUserId: string; avatarUrl: string | null; displayName: string | null };
  house: { id: string; name: string };
  roles: (HouseMemberRole & {
    assignedAt: Date;
    role: HouseRole & {
      permissions: { permission: HousePermission }[];
      _count: { accessRights: number };
    };
  })[];
};

const formatDate = (d: Date): string => new Date(d).toISOString().replace('T', ' ').slice(0, 19);

function toHouseMemberRoleBrief(
  mr: HouseMemberRole & {
    role: HouseRole & {
      permissions: { permission: HousePermission }[];
      _count: { accessRights: number };
    };
  },
): HouseMemberRoleBriefDto {
  return {
    memberRoleId: mr.id,
    roleId: mr.role.id,
    name: mr.role.name,
    priority: mr.role.priority,
    isSystem: mr.role.isSystem,
    permissions: mr.role.permissions.map((p) => p.permission),
    accessRightsCount: mr.role._count.accessRights,
    assignedAt: formatDate(mr.assignedAt),
  };
}

function toMemberEffectivePermission(
  e: EffectivePermission & { resource: Resource },
): MemberEffectivePermissionDto {
  return {
    resourceId: e.resourceId,
    resourceType: e.resource.type,
    name: e.resource.name ?? undefined,
    externalId: e.resource.externalId ?? undefined,
    path: e.resource.path,
    accessRightType: e.accessRightType,
    sourceType: e.sourceType,
    sourceId: e.sourceId ?? undefined,
    expiresAt: e.expiresAt ? formatDate(e.expiresAt) : undefined,
  };
}

export function toHouseMemberListItemResponse(m: MemberWithUserAndHouseMapper): HouseMemberListItemDto {
  return {
    id: m.id,
    userId: m.user.externalUserId,
    userDisplayName: m.user.displayName?.trim() || undefined,
    userAvatarUrl: m.user.avatarUrl ?? undefined,
    joinedAt: formatDate(m.joinedAt),
    roles: m.roles.map(toHouseMemberRoleBrief),
  };
}

export function toHouseMemberResponse(m: MemberWithUserAndHouseMapper): HouseMemberResponseDto {
  return {
    ...toHouseMemberListItemResponse(m),
    houseId: m.house.id,
    houseName: m.house.name,
  };
}

export function toHouseMemberDetailResponse(data: MemberWithAccessDetails): HouseMemberDetailResponseDto {
  const { member, effective, directRights } = data;
  return {
    ...toHouseMemberResponse(member),
    effectivePermissions: effective.map(toMemberEffectivePermission),
    directAccessRights: directRights.map((r: RightWithRelations) => toHouseAccessRightResponse(r)),
  };
}

