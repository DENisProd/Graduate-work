import 'reflect-metadata';
import { join } from 'path';
import * as http from 'http';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadGatewayConfig } from './config/gateway.config';
import { ProxyService } from './proxy/proxy.service';
import { buildUpstreamWsPath } from './proxy/ws-path';

loadEnv({ path: join(process.cwd(), '../../.env') });
loadEnv({ path: join(process.cwd(), '.env'), override: true });

async function bootstrap() {
  const config = loadGatewayConfig();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.enableCors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-User-Id', 'X-User-Display-Name'],
    credentials: true,
  });

  const proxyService = app.get(ProxyService);

  // ── WebSocket proxy (Socket.IO) ──────────────────────────────────────────
  // Uses http.request() with the 'upgrade' event — same HTTP client path that
  // already handles regular REST calls successfully. Avoids the low-level
  // net.connect() / socket-pipe approach used by http-proxy which can be
  // unreliable in some runtimes (Bun).
  const httpServer = app.getHttpServer();

  httpServer.on('upgrade', (req: http.IncomingMessage, socket: any, head: Buffer) => {
    const url = req.url ?? '';
    const entry = proxyService.wsProxies.find(({ prefix }) => url.startsWith(prefix));

    if (!entry) {
      socket.destroy();
      return;
    }

    socket.on('error', (err: Error) => {
      console.error('[WS] client socket error:', err.message);
    });

    let targetUrl: URL;
    try {
      targetUrl = new URL(entry.target);
    } catch {
      console.error('[WS] invalid target URL:', entry.target);
      socket.destroy();
      return;
    }

    const reqHeaders = { ...req.headers };
    // Replace Host with the upstream host so the backend doesn't reject it
    reqHeaders.host = targetUrl.host;

    const upstreamPath = buildUpstreamWsPath(url, entry.target, entry.pathRewrite);

    const proxyReq = http.request({
      hostname: targetUrl.hostname,
      port: Number(targetUrl.port) || 80,
      path: upstreamPath,
      method: req.method ?? 'GET',
      headers: reqHeaders,
    });

    proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
      let head101 = 'HTTP/1.1 101 Switching Protocols\r\n';
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        const values = Array.isArray(v) ? v : [v];
        for (const val of values) {
          if (val !== undefined) head101 += `${k}: ${val}\r\n`;
        }
      }
      head101 += '\r\n';

      try {
        socket.write(head101);
      } catch {
        proxySocket.destroy();
        return;
      }

      // Flush any buffered bytes
      if (proxyHead?.length) socket.write(proxyHead);
      if (head?.length) proxySocket.write(head);

      proxySocket.on('error', (err: Error) => {
        console.error('[WS] upstream socket error:', err.message);
        socket.destroy();
      });
      socket.on('error', (err: Error) => {
        console.error('[WS] client socket error (pipe):', err.message);
        proxySocket.destroy();
      });

      proxySocket.on('end', () => { try { socket.end(); } catch {} });
      socket.on('end', () => { try { proxySocket.end(); } catch {} });
      proxySocket.on('close', () => { try { socket.destroy(); } catch {} });
      socket.on('close', () => { try { proxySocket.destroy(); } catch {} });

      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on('response', (proxyRes) => {
      // Node may emit `response` with 101 even when `upgrade` already handled the handshake.
      if (proxyRes.statusCode === 101) return;
      console.error('[WS] upstream non-101 response:', proxyRes.statusCode);
      socket.destroy();
    });

    proxyReq.on('error', (err) => {
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
