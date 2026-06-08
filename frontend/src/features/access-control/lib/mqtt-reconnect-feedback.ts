import type { HouseMqttConfigResponse } from '@/types/api';

export function mqttReconnectToastKey(cfg: HouseMqttConfigResponse): 'success' | 'failed' | 'pending' {
  if (cfg.status?.connected) return 'success';
  if (cfg.status?.lastError) return 'failed';
  return 'pending';
}

export function formatMqttLastError(cfg: HouseMqttConfigResponse): string | undefined {
  return cfg.status?.lastError?.trim() || undefined;
}
