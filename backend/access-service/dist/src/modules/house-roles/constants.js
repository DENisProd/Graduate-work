"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_ROLE_PERMISSIONS = exports.SYSTEM_ROLE_PRIORITIES = exports.SYSTEM_ROLE_NAMES = void 0;
const client_1 = require("@prisma/client");
exports.SYSTEM_ROLE_NAMES = {
    OWNER: 'Владелец',
    ADMIN: 'Админ',
    DEFAULT: 'По умолчанию',
};
exports.SYSTEM_ROLE_PRIORITIES = {
    [exports.SYSTEM_ROLE_NAMES.OWNER]: 1,
    [exports.SYSTEM_ROLE_NAMES.ADMIN]: 2,
    [exports.SYSTEM_ROLE_NAMES.DEFAULT]: 3,
};
const ALL_HOUSE_PERMISSIONS = [
    client_1.HousePermission.INVITE_MEMBERS,
    client_1.HousePermission.EDIT_ROLES,
    client_1.HousePermission.MANAGE_DEVICES,
    client_1.HousePermission.MANAGE_AUTOMATIONS,
];
exports.SYSTEM_ROLE_PERMISSIONS = {
    [exports.SYSTEM_ROLE_NAMES.OWNER]: ALL_HOUSE_PERMISSIONS,
    [exports.SYSTEM_ROLE_NAMES.ADMIN]: ALL_HOUSE_PERMISSIONS,
    [exports.SYSTEM_ROLE_NAMES.DEFAULT]: [],
};
