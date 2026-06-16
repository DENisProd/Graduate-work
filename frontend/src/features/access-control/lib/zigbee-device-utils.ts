import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';

export const MONGO_OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function collectExposedProperties(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectExposedProperties(item, out));
    return;
  }
  if (!node || typeof node !== 'object') return;
  const expose = node as Record<string, unknown>;
  const prop = expose.property;
  if (typeof prop === 'string' && prop.length > 0) {
    out.add(prop.toLowerCase());
  } else if (
    typeof expose.name === 'string' &&
    expose.name.length > 0 &&
    typeof expose.type === 'string' &&
    expose.type !== 'composite' &&
    expose.type !== 'light'
  ) {
    out.add(expose.name.toLowerCase());
  }
  for (const key of ['features', 'items', 'endpoints', 'values']) {
    collectExposedProperties(expose[key], out);
  }
}

export function deviceCapabilitySet(device: ZigbeeDeviceListItem): Set<string> {
  const caps = new Set((device.capabilities ?? []).map((c) => c.toLowerCase()));
  const definition = device.definition;
  if (definition && Array.isArray(definition.exposes)) {
    collectExposedProperties(definition.exposes, caps);
  }
  return caps;
}

export function zigbeeAddress(device: ZigbeeDeviceListItem): string {
  return device.ieeeAddr ?? device.protocolAddress ?? device.id;
}

export function zigbeeDisplayName(device: ZigbeeDeviceListItem): string {
  const raw = device.friendlyName || device.name || zigbeeAddress(device);
  return typeof raw === 'string' ? raw.trim() : String(raw);
}

export function isZigbeeDevice(device: ZigbeeDeviceListItem): boolean {
  return Boolean(
    (device.ieeeAddr && device.ieeeAddr.length > 0) ||
      (device.protocolAddress && device.protocolAddress.length > 0)
  );
}

export function buildZigbeeSubscribePayload(devices: ZigbeeDeviceListItem[]): {
  deviceIeeeAddrs: string[];
  physicalDeviceIds: string[];
} {
  const ieee = new Set<string>();
  const ids = new Set<string>();

  for (const d of devices) {
    if (MONGO_OBJECT_ID_RE.test(d.id)) ids.add(d.id);
    if (d.physicalDeviceId && MONGO_OBJECT_ID_RE.test(d.physicalDeviceId)) {
      ids.add(d.physicalDeviceId);
    }
    if (isZigbeeDevice(d)) {
      const addr = zigbeeAddress(d).trim();
      if (addr.length >= 3) ieee.add(addr);
    }
  }

  return {
    deviceIeeeAddrs: [...ieee].slice(0, 200),
    physicalDeviceIds: [...ids].slice(0, 200),
  };
}

export function stableZigbeeSubscribeKey(payload: {
  deviceIeeeAddrs: string[];
  physicalDeviceIds: string[];
}): string {
  return JSON.stringify({
    i: [...payload.deviceIeeeAddrs].sort(),
    p: [...payload.physicalDeviceIds].sort(),
  });
}

export function resolveZigbeeStateForDevice(
  map: ReadonlyMap<string, ZigbeeStateWire>,
  device: ZigbeeDeviceListItem
): ZigbeeStateWire | undefined {
  const byId = map.get(device.id);
  if (byId) return byId;
  if (device.physicalDeviceId) {
    const byPid = map.get(device.physicalDeviceId);
    if (byPid) return byPid;
  }
  return map.get(zigbeeAddress(device));
}
