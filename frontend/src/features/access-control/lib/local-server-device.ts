const LOCAL_SERVER_DEVICE_ID_PREFIX = 'local-server:';

export function toLocalServerDeviceId(sessionId: string): string {
  return `${LOCAL_SERVER_DEVICE_ID_PREFIX}${sessionId}`;
}

export function parseLocalServerDeviceId(deviceId: string): string | null {
  let decoded = deviceId;
  try {
    decoded = decodeURIComponent(deviceId);
  } catch {
    decoded = deviceId;
  }

  if (!decoded.startsWith(LOCAL_SERVER_DEVICE_ID_PREFIX)) return null;

  const sessionId = decoded.slice(LOCAL_SERVER_DEVICE_ID_PREFIX.length).trim();
  return sessionId.length > 0 ? sessionId : null;
}
