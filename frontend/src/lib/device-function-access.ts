export type FunctionAccessMap = Record<string, { read: boolean; write: boolean }>;

export type DeviceLabelSource = {
  name?: string | null;
  friendlyName?: string | null;
  model?: string | null;
  modelId?: string | null;
};

export function devicePowerFunctionKey(deviceExternalId: string): string {
  return `fn:${deviceExternalId}:power`;
}

export function deviceTargetTempFunctionKey(deviceExternalId: string): string {
  return `fn:${deviceExternalId}:target_temp`;
}

/** Infer catalog device externalId from a human-readable label (demo seed naming). */
export function inferDeviceExternalId(label: string | null | undefined): string | null {
  if (!label?.trim()) return null;
  const lower = label.toLowerCase();
  if (lower.includes('коридор') || lower.includes('corridor')) return 'demo-corridor-light';
  if (
    (lower.includes('гостин') || lower.includes('living')) &&
    (lower.includes('терм') || lower.includes('thermo') || lower.includes('climate'))
  ) {
    return 'demo-living-thermo';
  }
  if (lower.includes('гостин') || lower.includes('living')) return 'demo-living-light';
  if (lower.includes('спальн') || lower.includes('bedroom')) return 'demo-bedroom-light';
  return null;
}

export function deviceDisplayLabel(device: DeviceLabelSource): string {
  return (
    device.friendlyName?.trim() ||
    device.name?.trim() ||
    device.modelId ||
    device.model?.trim() ||
    ''
  );
}

export function canWriteFunction(access: FunctionAccessMap | null, functionKey: string): boolean {
  if (!access) return false;
  return access[functionKey]?.write ?? false;
}

export function canControlDevicePower(
  access: FunctionAccessMap | null,
  device: DeviceLabelSource,
): boolean {
  const externalId = inferDeviceExternalId(deviceDisplayLabel(device));
  if (!externalId) return false;
  return canWriteFunction(access, devicePowerFunctionKey(externalId));
}

export function canControlDeviceTargetTemp(
  access: FunctionAccessMap | null,
  device: DeviceLabelSource,
): boolean {
  const externalId = inferDeviceExternalId(deviceDisplayLabel(device));
  if (!externalId) return false;
  return canWriteFunction(access, deviceTargetTempFunctionKey(externalId));
}
