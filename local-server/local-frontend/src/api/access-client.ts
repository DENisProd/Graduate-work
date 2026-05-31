import axios from 'axios'
import { useSettingsStore } from '@/stores/settings.store'
import { resolveAccessServiceUrl } from '@/lib/server-url'

/** HTTP client for NestJS access-service (houses, members, roles, …), not local-server. */
export const accessApi = axios.create()

accessApi.interceptors.request.use((config) => {
  const { accessServiceUrl, userId } = useSettingsStore.getState()
  config.baseURL = resolveAccessServiceUrl(accessServiceUrl)
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})
