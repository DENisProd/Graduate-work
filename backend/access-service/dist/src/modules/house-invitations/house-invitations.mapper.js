"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHouseInvitationResponse = toHouseInvitationResponse;
exports.toHouseInvitationPageResponse = toHouseInvitationPageResponse;
const formatDate = (d) => d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';
function invitationPermissionsForResponse(i) {
    if (i.roleId && i.role?.permissions?.length) {
        return i.role.permissions.map((p) => p.permission);
    }
    if (i.invitedPermissions?.length) {
        return i.invitedPermissions;
    }
    return undefined;
}
function toHouseInvitationResponse(i) {
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
function toHouseInvitationPageResponse(content, page, size, total) {
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
