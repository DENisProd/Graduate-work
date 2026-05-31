import axios from 'axios'
import { useSettingsStore } from '@/stores/settings.store'

export const api = axios.create()

api.interceptors.request.use((config) => {
  const { serverUrl, userId } = useSettingsStore.getState()
  config.baseURL = serverUrl
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})
