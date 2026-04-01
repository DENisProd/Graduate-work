"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHouseMemberListItemResponse = toHouseMemberListItemResponse;
exports.toHouseMemberResponse = toHouseMemberResponse;
exports.toHouseMemberDetailResponse = toHouseMemberDetailResponse;
const access_control_mapper_1 = require("../access-control/access-control.mapper");
const formatDate = (d) => new Date(d).toISOString().replace('T', ' ').slice(0, 19);
function toHouseMemberRoleBrief(mr) {
    return {
        memberRoleId: mr.id,
        roleId: mr.role.id,
        name: mr.role.name,
        priority: mr.role.priority,
        isSystem: mr.role.isSystem,
        permissions: mr.role.permissions.map((p) => p.permission),
        assignedAt: formatDate(mr.assignedAt),
    };
}
function toMemberEffectivePermission(e) {
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
function toHouseMemberListItemResponse(m) {
    return {
        id: m.id,
        userId: m.user.externalUserId,
        userAvatarUrl: m.user.avatarUrl ?? undefined,
        joinedAt: formatDate(m.joinedAt),
        roles: m.roles.map(toHouseMemberRoleBrief),
    };
}
function toHouseMemberResponse(m) {
    return {
        ...toHouseMemberListItemResponse(m),
        houseId: m.house.id,
        houseName: m.house.name,
    };
}
function toHouseMemberDetailResponse(data) {
    const { member, effective, directRights } = data;
    return {
        ...toHouseMemberResponse(member),
        effectivePermissions: effective.map(toMemberEffectivePermission),
        directAccessRights: directRights.map((r) => (0, access_control_mapper_1.toHouseAccessRightResponse)(r)),
    };
}
