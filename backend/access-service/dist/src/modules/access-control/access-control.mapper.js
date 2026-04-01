"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHouseAccessRightResponse = toHouseAccessRightResponse;
exports.toHouseAccessRightPageResponse = toHouseAccessRightPageResponse;
const client_1 = require("@prisma/client");
const formatDate = (d) => d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';
function toHouseAccessRightResponse(r) {
    const now = new Date();
    const expired = r.expiresAt != null && r.expiresAt <= now;
    const params = r.parameters;
    return {
        id: r.id,
        houseId: r.resource.house.id,
        houseName: r.resource.house.name,
        houseMemberId: r.houseMember?.id ?? undefined,
        houseRoleId: r.role?.id ?? undefined,
        houseRoleName: r.role?.name ?? undefined,
        userId: r.houseMember?.user.externalUserId ?? undefined,
        userName: r.houseMember?.user.avatarUrl ?? undefined,
        deviceId: r.resource.type === client_1.ResourceType.DEVICE ? r.resource.externalId ?? undefined : undefined,
        deviceFunctionId: r.resource.type === client_1.ResourceType.DEVICE_FUNCTION ? r.resource.externalId ?? undefined : undefined,
        houseRoomId: r.resource.type === client_1.ResourceType.ROOM ? r.resource.id : undefined,
        houseRoomName: r.resource.type === client_1.ResourceType.ROOM ? r.resource.name ?? undefined : undefined,
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
function toHouseAccessRightPageResponse(content, page, size, total) {
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
