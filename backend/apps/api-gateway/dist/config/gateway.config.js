"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GATEWAY_CONFIG = void 0;
exports.loadGatewayConfig = loadGatewayConfig;
function parseCorsOrigins(raw, fallback) {
    const parts = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : fallback;
}
function loadGatewayConfig() {
    console.log('[GatewayConfig] env:', {
        ACCESS_SERVICE_URL: process.env.ACCESS_SERVICE_URL,
        SCENARIO_SERVICE_URL: process.env.SCENARIO_SERVICE_URL,
        GATEWAY_PORT: process.env.GATEWAY_PORT,
        KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
        MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
    });
    const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? 'ws://localhost:8083';
    if (/:18083/.test(mqttBrokerUrl)) {
        console.warn('[GatewayConfig] MQTT_BROKER_URL uses port 18083 (EMQX Dashboard). ' +
            'Use WebSocket port 8083 instead, e.g. ws://mqtt-gateway:8083');
    }
    return {
        port: Number(process.env.GATEWAY_PORT ?? 8082),
        accessServiceUrl: process.env.ACCESS_SERVICE_URL ?? 'http://localhost:8086',
        scenarioServiceUrl: process.env.SCENARIO_SERVICE_URL ?? 'http://localhost:8095',
        mqttBrokerUrl,
        keycloakIssuer: process.env.KEYCLOAK_ISSUER ?? '',
        corsOrigins: parseCorsOrigins(process.env.GATEWAY_CORS_ORIGINS, [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost',
        ]),
    };
}
exports.GATEWAY_CONFIG = Symbol('GATEWAY_CONFIG');
//# sourceMappingURL=gateway.config.js.map