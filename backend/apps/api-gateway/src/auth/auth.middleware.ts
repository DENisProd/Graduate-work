import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { JwksClient } from 'jwks-rsa';
import { GATEWAY_CONFIG, type GatewayConfig } from '../config/gateway.config';
import { PUBLIC_PREFIXES } from '../config/routes.config';
import { getRequestPathname } from '../proxy/request-path';

interface DeviceCacheEntry {
  externalUserId: string;
  expiresAt: number;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  private jwksClient: JwksClient | null = null;
  private readonly deviceTokenCache = new Map<string, DeviceCacheEntry>();

  constructor(@Inject(GATEWAY_CONFIG) private readonly config: GatewayConfig) {
    if (config.keycloakIssuer) {
      this.jwksClient = jwksRsa({
        jwksUri: `${config.keycloakIssuer}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxEntries: 10,
        cacheMaxAge: 10 * 60 * 1000, // 10 min
        rateLimit: true,
      });
    } else {
      this.logger.warn('KEYCLOAK_ISSUER not set — JWT validation is disabled');
    }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Preflight requests never carry auth
    if (req.method === 'OPTIONS') return next();

    // Public paths bypass auth (prefix match or exact /health suffix)
    const path = getRequestPathname(req);
    if (PUBLIC_PREFIXES.some((p) => path.startsWith(p)) || path.endsWith('/health')) return next();

    // No Keycloak configured — pass through (development mode)
    if (!this.jwksClient) return next();

    const token = this.extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    try {
      const payload = await this.verifyToken(token);

      // Forward identity headers to upstream services
      req.headers['x-user-id'] = payload.sub as string;
      if (payload['preferred_username']) {
        req.headers['x-user-display-name'] = encodeURIComponent(
          payload['preferred_username'] as string,
        );
      }
      next();
    } catch (err) {
      this.logger.warn(`JWT validation failed: ${(err as Error).message}`);

      // Fallback: validate as device auth_code (UUID Bearer token from local server)
      const deviceUser = await this.tryDeviceToken(token);
      if (deviceUser) {
        req.headers['x-user-id'] = deviceUser.externalUserId;
        return next();
      }

      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  private async tryDeviceToken(token: string): Promise<{ externalUserId: string } | null> {
    // Check in-process cache (60-second TTL) to avoid a DB round-trip on every request
    const cached = this.deviceTokenCache.get(token);
    if (cached) {
      if (Date.now() < cached.expiresAt) return { externalUserId: cached.externalUserId };
      this.deviceTokenCache.delete(token);
    }

    try {
      const url = `${this.config.accessServiceUrl}/api/access/v1/device-auth/validate-token`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json() as { valid: boolean; externalUserId?: string };
      if (!data.valid || !data.externalUserId) return null;

      this.deviceTokenCache.set(token, { externalUserId: data.externalUserId, expiresAt: Date.now() + 60_000 });
      return { externalUserId: data.externalUserId };
    } catch {
      return null;
    }
  }

  private extractBearerToken(req: Request): string | null {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }

  private verifyToken(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded?.header?.kid) {
        return reject(new Error('Missing kid in JWT header'));
      }

      this.jwksClient!.getSigningKey(decoded.header.kid, (err, key) => {
        if (err || !key) return reject(err ?? new Error('No signing key'));
        const publicKey = key.getPublicKey();
        jwt.verify(
          token,
          publicKey,
          { algorithms: ['RS256'], issuer: this.config.keycloakIssuer },
          (verifyErr, payload) => {
            if (verifyErr) return reject(verifyErr);
            resolve(payload as jwt.JwtPayload);
          },
        );
      });
    });
  }
}
