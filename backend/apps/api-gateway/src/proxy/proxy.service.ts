import { Inject, Injectable, Logger } from '@nestjs/common';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { GATEWAY_CONFIG, type GatewayConfig } from '../config/gateway.config';
import { ServiceKey, UPSTREAM_ROUTES } from '../config/routes.config';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly routes: Array<{ prefix: string; handler: RequestHandler }> = [];
  private readonly fallbackProxy: RequestHandler;
  readonly wsProxies: Array<{ prefix: string; target: string }> = [];

  constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {
    const serviceUrls: Record<ServiceKey, string> = {
      scenario: config.scenarioServiceUrl,
      access: config.accessServiceUrl,
      devices: config.deviceServiceUrl,
    };

    for (const route of UPSTREAM_ROUTES) {
      const target = serviceUrls[route.service];
      const handler = this.createProxy(target, route.pathRewrite);
      this.routes.push({ prefix: route.prefix, handler });
      if (route.ws) {
        this.wsProxies.push({ prefix: route.prefix, target });
      }
    }

    this.fallbackProxy = this.createProxy(config.accessServiceUrl);
    this.logger.log(
      `Routing: /api/scenario→${config.scenarioServiceUrl} /api/access→${config.accessServiceUrl} /api/devices→${config.deviceServiceUrl}`,
    );
  }

  resolve(path: string): RequestHandler {
    for (const { prefix, handler } of this.routes) {
      if (path.startsWith(prefix)) return handler;
    }
    return this.fallbackProxy;
  }

  middleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      this.resolve(req.path)(req, res, next);
    };
  }

  private createProxy(target: string, pathRewrite?: Record<string, string>): RequestHandler {
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
      },
    };
    return createProxyMiddleware(options);
  }
}
