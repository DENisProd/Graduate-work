import 'reflect-metadata';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import * as httpProxy from 'http-proxy';
import { AppModule } from './app.module';
import { loadGatewayConfig } from './config/gateway.config';
import { ProxyService } from './proxy/proxy.service';

// cwd = backend/apps/api-gateway/ (cd'd by start script)
loadEnv({ path: join(process.cwd(), '../../.env') });
// Allow local override
loadEnv({ path: join(process.cwd(), '.env') });

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

  // ── WebSocket proxy (Socket.IO) ──────────────────────────────────────────
  // http-proxy-middleware v2 does not support upgrade events in NestJS/Express
  // directly, so we attach a raw http-proxy to the underlying HTTP server.
  const wsProxyServer = httpProxy.createProxyServer({ ws: true, changeOrigin: true });
  wsProxyServer.on('error', (err, _req, socket) => {
    console.error('[WS proxy error]', err.message);
    if (socket && typeof (socket as any).destroy === 'function') {
      (socket as any).destroy();
    }
  });

  const proxyService = app.get(ProxyService);

  const httpServer = app.getHttpServer();
  httpServer.on('upgrade', (req, socket, head) => {
    // Find the target for this WS path
    const entry = proxyService.wsProxies.find(({ prefix }) =>
      (req.url ?? '').startsWith(prefix),
    );
    if (entry) {
      wsProxyServer.ws(req, socket, head, { target: entry.target });
    } else {
      socket.destroy();
    }
  });

  await app.listen(config.port);
  console.log(`API Gateway running on http://localhost:${config.port}`);
  console.log(`CORS origins: ${config.corsOrigins.join(', ')}`);
  console.log(`MQTT broker proxied at /api/mqtt → ${config.mqttBrokerUrl}`);
}

bootstrap();
