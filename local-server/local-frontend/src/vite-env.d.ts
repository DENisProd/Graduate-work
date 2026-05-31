/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_SERVER_URL: string
  /** NestJS access-service (houses, RBAC). Default http://localhost:8085 */
  readonly VITE_ACCESS_SERVICE_URL?: string
  readonly VITE_DEFAULT_GATEWAY_URL: string
  readonly VITE_DEFAULT_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
