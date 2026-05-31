import axios from 'axios'
import { useSettingsStore } from '@/stores/settings.store'
import { resolveServerUrl } from '@/lib/server-url'

export const api = axios.create()

api.interceptors.request.use((config) => {
  const { serverUrl, userId } = useSettingsStore.getState()
  config.baseURL = resolveServerUrl(serverUrl)
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})
