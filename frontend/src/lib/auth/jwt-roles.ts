/** Decode JWT payload (client-side UI only, not for authorization). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob !== 'undefined'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getKeycloakRolesFromPayload(payload: Record<string, unknown>): string[] {
  const realmRoles =
    (payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const resourceAccess = payload.resource_access as
    | Record<string, { roles?: string[] }>
    | undefined;
  const clientRoles = resourceAccess
    ? Object.values(resourceAccess).flatMap((entry) => entry.roles ?? [])
    : [];
  return [...new Set([...realmRoles, ...clientRoles])];
}

const DEFAULT_PLATFORM_ADMIN_ROLES = ['platform-admin', 'admin', 'realm-admin'];

export function getPlatformAdminRoleNames(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_PLATFORM_ADMIN_ROLES;
  if (!fromEnv?.trim()) return DEFAULT_PLATFORM_ADMIN_ROLES;
  return fromEnv
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

export function hasPlatformAdminRole(accessToken: string | null | undefined): boolean {
  if (!accessToken) return false;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return false;
  const roles = getKeycloakRolesFromPayload(payload);
  const allowed = new Set(getPlatformAdminRoleNames().map((r) => r.toLowerCase()));
  return roles.some((role) => allowed.has(role.toLowerCase()));
}
