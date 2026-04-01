import { HousePermission } from '@prisma/client';
export declare const SYSTEM_ROLE_NAMES: {
    readonly OWNER: "Владелец";
    readonly ADMIN: "Админ";
    readonly DEFAULT: "По умолчанию";
};
export declare const SYSTEM_ROLE_PRIORITIES: {
    readonly Владелец: 1;
    readonly Админ: 2;
    readonly "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E": 3;
};
export declare const SYSTEM_ROLE_PERMISSIONS: Record<string, HousePermission[]>;
