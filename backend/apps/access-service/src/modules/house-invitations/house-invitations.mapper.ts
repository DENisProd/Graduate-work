import { HouseInvitationResponseDto } from './dto/house-invitation-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { HouseInvitation, House, HouseMember, User, HouseRole, HousePermission } from '@prisma/client';

type InvitationWithRelations = HouseInvitation & {
  house: House;
  invitedBy: (HouseMember & { user: User }) | null;
  role: (HouseRole & { permissions: { permission: HousePermission }[] }) | null;
};

const formatDate = (d: Date | null | undefined): string =>
  d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';

function invitationPermissionsForResponse(i: InvitationWithRelations): HousePermission[] | undefined {
  if (i.roleId && i.role?.permissions?.length) {
    return i.role.permissions.map((p) => p.permission);
  }
  if (i.invitedPermissions?.length) {
    return i.invitedPermissions;
  }
  return undefined;
}

export function toHouseInvitationResponse(i: InvitationWithRelations): HouseInvitationResponseDto {
  return {
    id: i.id,
    houseId: i.house.id,
    houseName: i.house.name,
    email: i.email ?? '',
    token: i.tokenHash,
    status: i.status,
    createdAt: formatDate(i.createdAt),
    acceptedAt: i.acceptedAt ? formatDate(i.acceptedAt) : undefined,
    expiresAt: i.expiresAt ? formatDate(i.expiresAt) : undefined,
    invitedById: i.invitedBy?.user?.externalUserId,
    roleId: i.roleId ?? undefined,
    roleName: i.role?.name,
    permissions: invitationPermissionsForResponse(i),
  };
}

export function toHouseInvitationPageResponse(
  content: InvitationWithRelations[],
  page: number,
  size: number,
  total: number,
): PageResponseDto<HouseInvitationResponseDto> {
  const totalPages = size > 0 ? Math.ceil(total / size) : 0;
  return {
    content: content.map(toHouseInvitationResponse),
    page,
    size,
    totalElements: total,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
    hasNext: page < totalPages - 1,
    hasPrevious: page > 0,
  };
}
