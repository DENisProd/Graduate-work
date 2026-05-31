import axios from 'axios'
import { useSettingsStore } from '@/stores/settings.store'

/** HTTP client for NestJS access-service (houses, members, roles, …), not local-server. */
export const accessApi = axios.create()

accessApi.interceptors.request.use((config) => {
  const { accessServiceUrl, userId } = useSettingsStore.getState()
  const fallback =
    (import.meta.env.VITE_ACCESS_SERVICE_URL as string | undefined)?.trim() ||
    'http://localhost:8085'
  const base = (accessServiceUrl || fallback).replace(/\/+$/, '')
  config.baseURL = base
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})
