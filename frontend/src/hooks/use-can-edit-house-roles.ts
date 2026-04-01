'use client';

import { useMemo } from 'react';

/** Код разрешения: управление ролями дома (создание, редактирование, удаление ролей с меньшим приоритетом). */
export const PERMISSION_EDIT_LOWER_ROLES = 'EDIT_LOWER_ROLES';

/**
 * Определяет, может ли текущий пользователь управлять ролями дома (Create/Edit/Delete).
 * Требуется разрешение EDIT_LOWER_ROLES для дома.
 *
 * Пока бэкенд не отдаёт список разрешений пользователя для дома,
 * возвращается true (все действия разрешены). Когда будет доступен
 * API вида GET /api/v1/houses/:houseId/members/me или GET /me/permissions,
 * нужно подставить проверку: permissions.includes(PERMISSION_EDIT_LOWER_ROLES).
 */
export function useCanEditHouseRoles(houseId: string | null): boolean {
  return useMemo(() => {
    if (!houseId) return false;
    // TODO: когда бэкенд отдаёт разрешения участника для дома — запросить и проверить
    // const { data: permissions } = useHouseMemberPermissions(houseId);
    // return permissions?.includes(PERMISSION_EDIT_LOWER_ROLES) ?? false;
    return true;
  }, [houseId]);
}
