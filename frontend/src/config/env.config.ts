const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4001';

export const env = {
  GATEWAY_URL: gatewayUrl,
  API_BASE_URL: `${gatewayUrl}/api/devices`,
  ACCESS_API_BASE_URL: `${gatewayUrl}/api/access`,
  PHYSICAL_DEVICES_API_BASE_URL: `${gatewayUrl}/api/scenario`,
} as const;
