export type ServiceKey = 'scenario' | 'access' | 'mqtt';

export interface UpstreamRoute {
  prefix: string;
  service: ServiceKey;
  pathRewrite?: Record<string, string>;
  ws?: boolean;
}

export const UPSTREAM_ROUTES: UpstreamRoute[] = [
  {
    prefix: '/api/scenario',
    service: 'scenario',
    pathRewrite: { '^/api/scenario': '' },
  },
  {
    prefix: '/api/access',
    service: 'access',
  },
  {
    prefix: '/socket.io',
    service: 'scenario',
    ws: true,
  },
  {
    prefix: '/api/mqtt',
    service: 'mqtt',
    pathRewrite: { '^/api/mqtt': '/mqtt' },
    ws: true,
  },
];

// /api/mqtt — WebSocket upgrade has no Bearer JWT; EMQX auth is MQTT username/password.
export const PUBLIC_PREFIXES = [
  '/health',
  '/api/v1/system/auth/',
  '/api/access/v1/device-auth/',
  '/socket.io',
  '/api/mqtt',
];
