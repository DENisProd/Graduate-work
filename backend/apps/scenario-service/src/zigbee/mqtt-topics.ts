export const HOUSE_PREFIX = 'houses';
export const CMD_SEGMENT = 'cmd';

export function houseDataPrefix(houseId: string): string {
  return `${HOUSE_PREFIX}/${houseId}/zigbee2mqtt`;
}

export function telemetryWildcard(houseId: string): string {
  return `${houseDataPrefix(houseId)}/#`;
}

export function statusTopic(houseId: string): string {
  return `${HOUSE_PREFIX}/${houseId}/status`;
}

export function buildCmdTopic(houseId: string, suffix: string): string {
  return `${HOUSE_PREFIX}/${houseId}/${CMD_SEGMENT}/zigbee2mqtt/${suffix}`;
}

/** Publish target for zigbee2mqtt bridge commands (permit_join, device/remove, …). */
export function resolveZigbeeCommandTopic(
  houseId: string,
  topicPrefix: string,
  suffix: string,
  usesCentralBroker: boolean,
): string {
  const trimmed = suffix.replace(/^\/+/, '');
  if (usesCentralBroker) {
    return buildCmdTopic(houseId, trimmed);
  }
  const base = topicPrefix.replace(/\/+$/, '');
  return trimmed ? `${base}/${trimmed}` : base;
}

export function parseHouseId(topic: string): string | null {
  const prefix = `${HOUSE_PREFIX}/`;
  if (!topic.startsWith(prefix)) return null;
  const rest = topic.slice(prefix.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  const houseId = rest.slice(0, slash);
  return houseId || null;
}

export function extractZ2mSuffix(houseId: string, topic: string): string | null {
  const prefix = `${houseDataPrefix(houseId)}/`;
  if (!topic.startsWith(prefix)) return null;
  return topic.slice(prefix.length);
}
