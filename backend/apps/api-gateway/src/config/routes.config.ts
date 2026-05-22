export type ServiceKey = 'scenario' | 'access' | 'devices';

export interface UpstreamRoute {
  prefix: string;
  service: ServiceKey;
  /** Strip this prefix from the path before forwarding to upstream. */
  pathRewrite?: Record<string, string>;
  /** Also forward WebSocket upgrade requests on this prefix. */
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
    pathRewrite: { '^/api/access': '' },
  },
  {
    prefix: '/api/devices',
    service: 'devices',
    pathRewrite: { '^/api/devices': '' },
  },
  {
    // Socket.IO upgrade — no path rewrite; scenario-service mounts it at root
    prefix: '/socket.io',
    service: 'scenario',
    ws: true,
  },
];

/** Paths that bypass JWT authentication (exact prefix match). */
export const PUBLIC_PREFIXES = ['/health'];
