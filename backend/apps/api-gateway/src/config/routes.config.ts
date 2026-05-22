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
    // scenario-service global prefix is /v1 (not /api/scenario/v1)
    pathRewrite: { '^/api/scenario': '' },
  },
  {
    prefix: '/api/access',
    service: 'access',
    // access-service global prefix is api/access/v1 — forward path as-is
  },
  {
    // Socket.IO upgrade — no path rewrite; scenario-service mounts it at root
    prefix: '/socket.io',
    service: 'scenario',
    ws: true,
  },
];

/** Paths that bypass JWT authentication (prefix match). */
export const PUBLIC_PREFIXES = ['/health'];
