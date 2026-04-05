import { HouseAccessRightResponseDto } from './dto/house-access-right-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { Prisma, ResourceType } from '@prisma/client';

export type RightWithRelations = Prisma.AccessRightGetPayload<{
  include: {
    resource: { include: { house: true } };
    houseMember: { include: { user: true } };
    role: true;
    grantedBy: true;
  };
}>;

const formatDate = (d: Date | null | undefined): string =>
  d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';

export function toHouseAccessRightResponse(r: RightWithRelations): HouseAccessRightResponseDto {
  const now = new Date();
  const expired = r.expiresAt != null && r.expiresAt <= now;
  const params = r.parameters as Record<string, string> | null;

  return {
    id: r.id,
    houseId: r.resource.house.id,
    houseName: r.resource.house.name,
    houseMemberId: r.houseMember?.id ?? undefined,
    houseRoleId: r.role?.id ?? undefined,
    houseRoleName: r.role?.name ?? undefined,
    userId: r.houseMember?.user.externalUserId ?? undefined,
    userName: r.houseMember?.user.avatarUrl ?? undefined,
    deviceId: r.resource.type === ResourceType.DEVICE ? r.resource.externalId ?? undefined : undefined,
    deviceFunctionId: r.resource.type === ResourceType.DEVICE_FUNCTION ? r.resource.externalId ?? undefined : undefined,
    houseRoomId: r.resource.type === ResourceType.ROOM ? r.resource.id : undefined,
    houseRoomName: r.resource.type === ResourceType.ROOM ? r.resource.name ?? undefined : undefined,
    accessRightType: r.accessRightType,
    parameters: params ?? {},
    createdAt: formatDate(r.createdAt),
    grantedById: r.grantedBy?.externalUserId,
    grantedByName: r.grantedBy?.avatarUrl ?? undefined,
    expiresAt: r.expiresAt ? formatDate(r.expiresAt) : undefined,
    isExpired: expired,
    isActive: !expired,
  };
}

export function toHouseAccessRightPageResponse(
  content: RightWithRelations[],
  page: number,
  size: number,
  total: number,
): PageResponseDto<HouseAccessRightResponseDto> {
  const totalPages = size > 0 ? Math.ceil(total / size) : 0;
  return {
    content: content.map(toHouseAccessRightResponse),
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
