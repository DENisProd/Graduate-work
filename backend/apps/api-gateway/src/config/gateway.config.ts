export interface GatewayConfig {
  port: number;
  accessServiceUrl: string;
  scenarioServiceUrl: string;
  mqttBrokerUrl: string;
  keycloakIssuer: string;
  corsOrigins: string[];
}

function parseCorsOrigins(raw: string | undefined, fallback: string[]): string[] {
  const parts = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

export function loadGatewayConfig(): GatewayConfig {
  console.log('[GatewayConfig] env:', {
    ACCESS_SERVICE_URL: process.env.ACCESS_SERVICE_URL,
    SCENARIO_SERVICE_URL: process.env.SCENARIO_SERVICE_URL,
    GATEWAY_PORT: process.env.GATEWAY_PORT,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  });
  return {
    port: Number(process.env.GATEWAY_PORT ?? 8080),
    accessServiceUrl: process.env.ACCESS_SERVICE_URL ?? 'http://localhost:8086',
    scenarioServiceUrl: process.env.SCENARIO_SERVICE_URL ?? 'http://localhost:8095',
    mqttBrokerUrl: process.env.MQTT_BROKER_URL ?? 'ws://localhost:8083',
    keycloakIssuer: process.env.KEYCLOAK_ISSUER ?? '',
    corsOrigins: parseCorsOrigins(process.env.GATEWAY_CORS_ORIGINS, [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost',
    ]),
  };
}

export const GATEWAY_CONFIG = Symbol('GATEWAY_CONFIG');
