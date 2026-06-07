"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProxyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const gateway_config_1 = require("../config/gateway.config");
const routes_config_1 = require("../config/routes.config");
const request_path_1 = require("./request-path");
let ProxyService = ProxyService_1 = class ProxyService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(ProxyService_1.name);
        this.routes = [];
        this.wsProxies = [];
        const serviceUrls = {
            scenario: config.scenarioServiceUrl,
            access: config.accessServiceUrl,
            mqtt: config.mqttBrokerUrl,
        };
        for (const route of routes_config_1.UPSTREAM_ROUTES) {
            const target = serviceUrls[route.service];
            const handler = this.createProxy(route.prefix, target, route.pathRewrite);
            this.routes.push({ prefix: route.prefix, handler });
            if (route.ws) {
                this.wsProxies.push({ prefix: route.prefix, target });
            }
        }
        this.logger.log(`Routing: /api/scenario→${config.scenarioServiceUrl} /api/access→${config.accessServiceUrl} /api/mqtt→${config.mqttBrokerUrl}`);
    }
    resolve(req) {
        const path = (0, request_path_1.getRequestPathname)(req);
        for (const { prefix, handler } of this.routes) {
            if (path.startsWith(prefix))
                return handler;
        }
        return (_req, res) => {
            res.status(404).json({ message: `No upstream route for ${path}` });
        };
    }
    middleware() {
        return (req, res, next) => {
            this.resolve(req)(req, res, next);
        };
    }
    createProxy(_prefix, target, pathRewrite) {
        // Do NOT pass a path filter here — NestJS strips req.url before middleware
        // runs, so http-proxy-middleware's internal filter would never match.
        // Routing is already handled by resolve() using req.originalUrl.
        const timings = new WeakMap();
        const options = {
            target,
            changeOrigin: true,
            pathRewrite,
            onError: (err, req, res) => {
                this.logger.error(`${req.method} ${(0, request_path_1.getRequestPathname)(req)} → ${target} ERROR: ${err.message}`);
                if (typeof res.status === 'function') {
                    res.status(502).json({ message: `Upstream unavailable: ${err.message}` });
                }
            },
            onProxyReq: (proxyReq, req) => {
                timings.set(req, Date.now());
                proxyReq.setHeader('X-Forwarded-Host', req.hostname);
                const body = req.body;
                if (body !== undefined && body !== null && typeof body === 'object' && Object.keys(body).length > 0) {
                    const raw = JSON.stringify(body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(raw));
                    proxyReq.write(raw);
                }
                this.logger.log(`→ ${req.method} ${(0, request_path_1.getRequestPathname)(req)} proxy to ${target}${proxyReq.path}`);
            },
            onProxyRes: (proxyRes, req) => {
                const ms = Date.now() - (timings.get(req) ?? Date.now());
                timings.delete(req);
                this.logger.log(`← ${req.method} ${(0, request_path_1.getRequestPathname)(req)} ${proxyRes.statusCode} [${ms}ms]`);
            },
        };
        return (0, http_proxy_middleware_1.createProxyMiddleware)(options);
    }
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = ProxyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(gateway_config_1.GATEWAY_CONFIG)),
    __metadata("design:paramtypes", [Object])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map