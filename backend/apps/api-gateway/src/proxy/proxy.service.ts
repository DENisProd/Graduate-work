import { Inject, Injectable, Logger } from '@nestjs/common';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { GATEWAY_CONFIG, type GatewayConfig } from '../config/gateway.config';
import { ServiceKey, UPSTREAM_ROUTES } from '../config/routes.config';
import { getRequestPathname } from './request-path';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly routes: Array<{ prefix: string; handler: RequestHandler }> = [];
  readonly wsProxies: Array<{ prefix: string; target: string }> = [];

  constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {
    const serviceUrls: Record<ServiceKey, string> = {
      scenario: config.scenarioServiceUrl,
      access: config.accessServiceUrl,
      devices: config.deviceServiceUrl,
    };

    for (const route of UPSTREAM_ROUTES) {
      const target = serviceUrls[route.service];
      const handler = this.createProxy(route.prefix, target, route.pathRewrite);
      this.routes.push({ prefix: route.prefix, handler });
      if (route.ws) {
        this.wsProxies.push({ prefix: route.prefix, target });
      }
    }

    this.logger.log(
      `Routing: /api/scenario→${config.scenarioServiceUrl} /api/access→${config.accessServiceUrl} /api/devices→${config.deviceServiceUrl}`,
    );
  }

  resolve(req: Request): RequestHandler {
    const path = getRequestPathname(req);
    for (const { prefix, handler } of this.routes) {
      if (path.startsWith(prefix)) return handler;
    }
    return (_req, res) => {
      res.status(404).json({ message: `No upstream route for ${path}` });
    };
  }

  middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      this.resolve(req)(req, res, next);
    };
  }

  private createProxy(
    prefix: string,
    target: string,
    pathRewrite?: Record<string, string>,
  ): RequestHandler {
    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite,
      onError: (err, req, res) => {
        this.logger.error(`Proxy error → ${target}: ${err.message}`);
        if (typeof (res as any).status === 'function') {
          (res as Response).status(502).json({ message: `Upstream unavailable: ${err.message}` });
        }
      },
      onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Forwarded-Host', (req as Request).hostname);
        this.logger.log(
          `${(req as Request).method} ${getRequestPathname(req as Request)} → ${target}${proxyReq.path}`,
        );
      },
    };
    return createProxyMiddleware(prefix, options);
  }
}
