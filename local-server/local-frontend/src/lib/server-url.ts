/** Strip trailing slashes from a base URL. */
function trimUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** Docker Compose service names — valid inside the network, not in the browser. */
const DOCKER_INTERNAL_HOSTS = new Set([
  'local-backend',
  'caddy',
  'mosquitto',
  'modbus-bridge',
  'zigbee2mqtt',
])

function isServedViaCaddy(): boolean {
  const port = window.location.port
  return port === '' || port === '80' || port === '443'
}

/** Localhost ports that should go through Caddy same-origin proxy in the browser. */
const LOCALHOST_PORTS_VIA_CADDY = new Set(['8080', '8050', '8082', '8085', '8086'])

/** URLs that must be rewritten to the current page origin in the browser. */
function shouldUseSameOrigin(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    if (DOCKER_INTERNAL_HOSTS.has(host)) return true

    if (
      (host === 'localhost' || host === '127.0.0.1') &&
      LOCALHOST_PORTS_VIA_CADDY.has(u.port) &&
      isServedViaCaddy()
    ) {
      return true
    }

    return false
  } catch {
    return false
  }
}

/**
 * Normalize a user-provided or persisted server URL for browser use.
 * Empty string → same origin (Caddy :80 or Vite dev proxy).
 */
export function normalizeServerUrl(url: string): string {
  const trimmed = trimUrl(url)
  if (!trimmed) {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080'
  }
  if (typeof window !== 'undefined' && shouldUseSameOrigin(trimmed)) {
    return window.location.origin
  }
  return trimmed
}

/**
 * Base URL for local-server HTTP + Socket.IO.
 */
export function resolveServerUrl(stored?: string): string {
  const persisted = stored?.trim()
  if (persisted) return normalizeServerUrl(persisted)

  const fromEnv = import.meta.env.VITE_LOCAL_SERVER_URL?.trim()
  if (fromEnv) return normalizeServerUrl(fromEnv)

  if (typeof window !== 'undefined') return window.location.origin

  return 'http://localhost:8080'
}

/** @deprecated Use normalizeServerUrl — kept for persisted-state migration hook. */
export function migrateLegacyServerUrl(stored: string): string {
  return normalizeServerUrl(stored)
}

/**
 * Base URL for NestJS access-service / api-gateway (paths include `/api/access/v1/...`).
 */
export function resolveAccessServiceUrl(stored?: string): string {
  const persisted = stored?.trim()
  if (persisted) return normalizeServerUrl(persisted)

  const fromEnv = import.meta.env.VITE_ACCESS_SERVICE_URL?.trim()
  if (fromEnv) return normalizeServerUrl(fromEnv)

  if (typeof window !== 'undefined') return window.location.origin

  return 'http://localhost:8082'
}
