"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_PREFIXES = exports.UPSTREAM_ROUTES = void 0;
exports.UPSTREAM_ROUTES = [
    {
        prefix: '/api/scenario',
        service: 'scenario',
        pathRewrite: { '^/api/scenario': '' },
    },
    {
        prefix: '/api/access',
        service: 'access',
    },
    {
        prefix: '/socket.io',
        service: 'scenario',
        ws: true,
    },
    {
        prefix: '/api/mqtt',
        service: 'mqtt',
        pathRewrite: { '^/api/mqtt': '/mqtt' },
        ws: true,
    },
];
// /api/mqtt — WebSocket upgrade has no Bearer JWT; EMQX auth is MQTT username/password.
exports.PUBLIC_PREFIXES = [
    '/health',
    '/api/v1/system/auth/',
    '/api/access/v1/device-auth/',
    '/socket.io',
    '/api/mqtt',
];
//# sourceMappingURL=routes.config.js.map