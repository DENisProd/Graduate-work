import { HouseResponseDto } from './dto/house-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { House, User } from '@prisma/client';

type HouseWithOwner = House & { owner: User };

const formatDate = (d: Date | null | undefined): string =>
  d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';

export function toHouseResponse(h: HouseWithOwner): HouseResponseDto {
  return {
    id: h.id,
    name: h.name,
    ownerId: h.owner.externalUserId,
    ownerAvatarUrl: h.owner.avatarUrl ?? undefined,
    avatarUrl: h.avatarUrl ?? undefined,
    address: h.address ?? undefined,
    createdAt: formatDate(h.createdAt),
    updatedAt: formatDate(h.updatedAt) || formatDate(h.createdAt),
  };
}

export function toHousePageResponse(
  content: HouseWithOwner[],
  page: number,
  size: number,
  total: number,
): PageResponseDto<HouseResponseDto> {
  const totalPages = size > 0 ? Math.ceil(total / size) : 0;
  return {
    content: content.map(toHouseResponse),
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
