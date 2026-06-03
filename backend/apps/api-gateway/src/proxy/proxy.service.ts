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
      mqtt: config.mqttBrokerUrl,
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
    _prefix: string,
    target: string,
    pathRewrite?: Record<string, string>,
  ): RequestHandler {
    // Do NOT pass a path filter here — NestJS strips req.url before middleware
    // runs, so http-proxy-middleware's internal filter would never match.
    // Routing is already handled by resolve() using req.originalUrl.
    const timings = new WeakMap<object, number>();

    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite,
      onError: (err, req, res) => {
        this.logger.error(
          `${(req as Request).method} ${getRequestPathname(req as Request)} → ${target} ERROR: ${err.message}`,
        );
        if (typeof (res as any).status === 'function') {
          (res as Response).status(502).json({ message: `Upstream unavailable: ${err.message}` });
        }
      },
      onProxyReq: (proxyReq, req) => {
        timings.set(req, Date.now());
        proxyReq.setHeader('X-Forwarded-Host', (req as Request).hostname);

        const body = (req as Request).body as unknown;
        if (body !== undefined && body !== null && typeof body === 'object' && Object.keys(body as object).length > 0) {
          const raw = JSON.stringify(body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(raw));
          proxyReq.write(raw);
        }

        this.logger.log(
          `→ ${(req as Request).method} ${getRequestPathname(req as Request)} proxy to ${target}${proxyReq.path}`,
        );
      },
      onProxyRes: (proxyRes, req) => {
        const ms = Date.now() - (timings.get(req) ?? Date.now());
        timings.delete(req);
        this.logger.log(
          `← ${(req as Request).method} ${getRequestPathname(req as Request)} ${proxyRes.statusCode} [${ms}ms]`,
        );
      },
    };
    return createProxyMiddleware(options);
  }
}
