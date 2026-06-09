"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path_1 = require("path");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const gateway_config_1 = require("./config/gateway.config");
const proxy_service_1 = require("./proxy/proxy.service");
const ws_path_1 = require("./proxy/ws-path");
(0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), '../../.env') });
(0, dotenv_1.config)({ path: (0, path_1.join)(process.cwd(), '.env'), override: true });
function reportDebug(hypothesisId, location, msg, data) {
    // #region debug-point A:gateway
    fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: 'emqx-gateway-connect',
            runId: 'pre-fix',
            hypothesisId,
            location,
            msg: `[DEBUG] ${msg}`,
            data,
            ts: Date.now(),
        }),
    }).catch(() => { });
    // #endregion
}
async function bootstrap() {
    const config = (0, gateway_config_1.loadGatewayConfig)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.enableCors({
        origin: config.corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-User-Id', 'X-User-Display-Name'],
        credentials: true,
    });
    const proxyService = app.get(proxy_service_1.ProxyService);
    // ── WebSocket proxy (Socket.IO) ──────────────────────────────────────────
    // Uses http.request() with the 'upgrade' event — same HTTP client path that
    // already handles regular REST calls successfully. Avoids the low-level
    // net.connect() / socket-pipe approach used by http-proxy which can be
    // unreliable in some runtimes (Bun).
    const httpServer = app.getHttpServer();
    httpServer.on('upgrade', (req, socket, head) => {
        const url = req.url ?? '';
        const entry = proxyService.wsProxies.find(({ prefix }) => url.startsWith(prefix));
        reportDebug('A', 'src/main.ts:upgrade', 'received websocket upgrade request', {
            url,
            matchedPrefix: entry?.prefix ?? null,
            target: entry?.target ?? null,
            upgrade: req.headers.upgrade ?? null,
            connection: req.headers.connection ?? null,
            host: req.headers.host ?? null,
        });
        if (!entry) {
            socket.destroy();
            return;
        }
        socket.on('error', (err) => {
            console.error('[WS] client socket error:', err.message);
        });
        let targetUrl;
        try {
            targetUrl = new URL(entry.target);
        }
        catch {
            console.error('[WS] invalid target URL:', entry.target);
            socket.destroy();
            return;
        }
        const reqHeaders = { ...req.headers };
        // Replace Host with the upstream host so the backend doesn't reject it
        reqHeaders.host = targetUrl.host;
        // EMQX MQTT-over-WebSocket requires the `mqtt` subprotocol; without it the
        // upgrade fails (502/426 from nginx or EMQX).
        if (entry.prefix === '/api/mqtt') {
            const proto = reqHeaders['sec-websocket-protocol'];
            if (!proto || (typeof proto === 'string' && !proto.split(',').map((s) => s.trim()).includes('mqtt'))) {
                reqHeaders['sec-websocket-protocol'] = proto ? `${proto}, mqtt` : 'mqtt';
            }
        }
        const upstreamPath = (0, ws_path_1.buildUpstreamWsPath)(url, entry.target, entry.pathRewrite);
        const isSecureUpstream = targetUrl.protocol === 'wss:' || targetUrl.protocol === 'https:';
        const requestImpl = isSecureUpstream ? https.request : http.request;
        const upstreamPort = Number(targetUrl.port) || (isSecureUpstream ? 443 : 80);
        reportDebug('A', 'src/main.ts:upgrade', 'proxying websocket upgrade upstream', {
            url,
            target: entry.target,
            upstreamProtocol: targetUrl.protocol,
            upstreamHost: targetUrl.host,
            upstreamPort,
            upstreamPath,
        });
        const proxyReq = requestImpl({
            hostname: targetUrl.hostname,
            port: upstreamPort,
            path: upstreamPath,
            method: req.method ?? 'GET',
            headers: reqHeaders,
        });
        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            reportDebug('C', 'src/main.ts:upgrade', 'upstream accepted websocket upgrade', {
                statusCode: proxyRes.statusCode ?? null,
                target: entry.target,
                upstreamPath,
            });
            let head101 = 'HTTP/1.1 101 Switching Protocols\r\n';
            for (const [k, v] of Object.entries(proxyRes.headers)) {
                const values = Array.isArray(v) ? v : [v];
                for (const val of values) {
                    if (val !== undefined)
                        head101 += `${k}: ${val}\r\n`;
                }
            }
            head101 += '\r\n';
            try {
                socket.write(head101);
            }
            catch {
                proxySocket.destroy();
                return;
            }
            // Flush any buffered bytes
            if (proxyHead?.length)
                socket.write(proxyHead);
            if (head?.length)
                proxySocket.write(head);
            proxySocket.on('error', (err) => {
                console.error('[WS] upstream socket error:', err.message);
                socket.destroy();
            });
            socket.on('error', (err) => {
                console.error('[WS] client socket error (pipe):', err.message);
                proxySocket.destroy();
            });
            proxySocket.on('end', () => { try {
                socket.end();
            }
            catch { } });
            socket.on('end', () => { try {
                proxySocket.end();
            }
            catch { } });
            proxySocket.on('close', () => { try {
                socket.destroy();
            }
            catch { } });
            socket.on('close', () => { try {
                proxySocket.destroy();
            }
            catch { } });
            proxySocket.pipe(socket);
            socket.pipe(proxySocket);
        });
        proxyReq.on('response', (proxyRes) => {
            // Node may emit `response` with 101 even when `upgrade` already handled the handshake.
            if (proxyRes.statusCode === 101)
                return;
            reportDebug('C', 'src/main.ts:upgrade', 'upstream returned non-101 response', {
                statusCode: proxyRes.statusCode ?? null,
                target: entry.target,
                upstreamPath,
            });
            console.error('[WS] upstream non-101 response:', proxyRes.statusCode);
            socket.destroy();
        });
        proxyReq.on('error', (err) => {
            reportDebug('C', 'src/main.ts:upgrade', 'upstream websocket connect error', {
                target: entry.target,
                upstreamPath,
                error: err.message,
            });
            console.error('[WS] upstream connect error:', err.message);
            socket.destroy();
        });
        proxyReq.end();
    });
    await app.listen(config.port);
    console.log(`API Gateway running on http://localhost:${config.port}`);
    console.log(`CORS origins: ${config.corsOrigins.join(', ')}`);
    console.log(`MQTT broker proxied at /api/mqtt → ${config.mqttBrokerUrl}`);
}
bootstrap();
//# sourceMappingURL=main.js.map