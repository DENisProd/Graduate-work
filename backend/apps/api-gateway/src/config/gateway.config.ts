export interface GatewayConfig {
  port: number;
  accessServiceUrl: string;
  deviceServiceUrl: string;
  scenarioServiceUrl: string;
  keycloakIssuer: string;
  corsOrigins: string[];
}

function parseCorsOrigins(raw: string | undefined, fallback: string[]): string[] {
  const parts = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

export function loadGatewayConfig(): GatewayConfig {
  return {
    port: Number(process.env.GATEWAY_PORT ?? 8080),
    accessServiceUrl: process.env.ACCESS_SERVICE_URL ?? 'http://localhost:8086',
    // GATEWAY_DEVICE_URL avoids conflict with scenario-service's own DEVICE_SERVICE_URL
    deviceServiceUrl: process.env.GATEWAY_DEVICE_URL ?? 'http://localhost:8090',
    scenarioServiceUrl: process.env.SCENARIO_SERVICE_URL ?? 'http://localhost:8095',
    keycloakIssuer: process.env.KEYCLOAK_ISSUER ?? '',
    corsOrigins: parseCorsOrigins(process.env.GATEWAY_CORS_ORIGINS, [
      'http://localhost:3000',
      'http://localhost:5173',
    ]),
  };
}

export const GATEWAY_CONFIG = Symbol('GATEWAY_CONFIG');
