export type ServiceKey = 'scenario' | 'access' | 'devices' | 'mqtt';

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
    pathRewrite: { '^/api/mqtt': '' },
    ws: true,
  },
];

export const PUBLIC_PREFIXES = ['/health','/api/v1/system/auth/','/api/access/v1/device-auth/'];
