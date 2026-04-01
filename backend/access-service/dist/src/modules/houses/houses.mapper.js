"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHouseResponse = toHouseResponse;
exports.toHousePageResponse = toHousePageResponse;
const formatDate = (d) => d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';
function toHouseResponse(h) {
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
function toHousePageResponse(content, page, size, total) {
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
