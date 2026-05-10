/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_SERVER_URL: string
  readonly VITE_DEFAULT_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
