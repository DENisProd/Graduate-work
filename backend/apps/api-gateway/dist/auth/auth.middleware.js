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
var AuthMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const jwks_rsa_1 = require("jwks-rsa");
const gateway_config_1 = require("../config/gateway.config");
const routes_config_1 = require("../config/routes.config");
const request_path_1 = require("../proxy/request-path");
let AuthMiddleware = AuthMiddleware_1 = class AuthMiddleware {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AuthMiddleware_1.name);
        this.jwksClient = null;
        this.deviceTokenCache = new Map();
        if (config.keycloakIssuer) {
            this.jwksClient = (0, jwks_rsa_1.default)({
                jwksUri: `${config.keycloakIssuer}/protocol/openid-connect/certs`,
                cache: true,
                cacheMaxEntries: 10,
                cacheMaxAge: 10 * 60 * 1000,
                rateLimit: true,
            });
        }
        else {
            this.logger.warn('KEYCLOAK_ISSUER not set — JWT validation is disabled');
        }
    }
    async use(req, res, next) {
        if (req.method === 'OPTIONS')
            return next();
        const path = (0, request_path_1.getRequestPathname)(req);
        if (routes_config_1.PUBLIC_PREFIXES.some((p) => path.startsWith(p)) || path.endsWith('/health'))
            return next();
        if (!this.jwksClient)
            return next();
        const token = this.extractBearerToken(req);
        if (!token) {
            return res.status(401).json({ message: 'Authorization header required' });
        }
        if (this.looksLikeJwt(token)) {
            try {
                const payload = await this.verifyToken(token);
                req.headers['x-user-id'] = payload.sub;
                if (payload['preferred_username']) {
                    req.headers['x-user-display-name'] = encodeURIComponent(payload['preferred_username']);
                }
                return next();
            }
            catch (err) {
                this.logger.warn(`JWT validation failed: ${err.message}`);
            }
        }
        const deviceUser = await this.tryDeviceToken(token);
        if (deviceUser) {
            req.headers['x-user-id'] = deviceUser.externalUserId;
            return next();
        }
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    async tryDeviceToken(token) {
        const cached = this.deviceTokenCache.get(token);
        if (cached) {
            if (Date.now() < cached.expiresAt)
                return { externalUserId: cached.externalUserId };
            this.deviceTokenCache.delete(token);
        }
        try {
            const url = `${this.config.accessServiceUrl}/api/access/v1/device-auth/validate-token`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok)
                return null;
            const data = await res.json();
            if (!data.valid || !data.externalUserId)
                return null;
            this.deviceTokenCache.set(token, { externalUserId: data.externalUserId, expiresAt: Date.now() + 60_000 });
            return { externalUserId: data.externalUserId };
        }
        catch {
            return null;
        }
    }
    extractBearerToken(req) {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer '))
            return null;
        return auth.slice(7);
    }
    looksLikeJwt(token) {
        return token.split('.').length === 3;
    }
    verifyToken(token) {
        return new Promise((resolve, reject) => {
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded?.header?.kid) {
                return reject(new Error('Missing kid in JWT header'));
            }
            this.jwksClient.getSigningKey(decoded.header.kid, (err, key) => {
                if (err || !key)
                    return reject(err ?? new Error('No signing key'));
                const publicKey = key.getPublicKey();
                jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: this.config.keycloakIssuer }, (verifyErr, payload) => {
                    if (verifyErr)
                        return reject(verifyErr);
                    resolve(payload);
                });
            });
        });
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = AuthMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(gateway_config_1.GATEWAY_CONFIG)),
    __metadata("design:paramtypes", [Object])
], AuthMiddleware);
//# sourceMappingURL=auth.middleware.js.map