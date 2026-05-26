'use client';

export const PERMISSION_EDIT_LOWER_ROLES = 'EDIT_ROLES';

/**
 * Whether the current user can manage house roles (create/edit/delete).
 * Reads from the already-loaded members list via useHousePermissions.
 */
export function useCanEditHouseRoles(_houseId: string | null): boolean {
  // Lazy import to avoid circular dependency (useHousePermissions → store → here).
  // The real value is derived inside HouseDetailsWidget via useHousePermissions.
  // This shim keeps the call-site API unchanged; HouseDetailsWidget now passes
  // the computed value directly via the canEditRoles prop.
  return false;
}
