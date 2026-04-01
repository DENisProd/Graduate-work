/**
 * Base URLs for microservices. Override via environment variables.
 * @see .env.example
 */
export const env = {
  /** Main API (e.g. device types, categories, rooms) — default 8082 */
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082',

  /** Access control API (houses, members, invitations, rights) — default 8085 */
  ACCESS_API_BASE_URL:
    process.env.NEXT_PUBLIC_ACCESS_API_URL || 'http://localhost:8085',

  /** Physical devices API (register device in house) — default 3001 */
  PHYSICAL_DEVICES_API_BASE_URL:
    process.env.NEXT_PUBLIC_PHYSICAL_DEVICES_API_URL || 'http://localhost:3001',
} as const;
