import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

const AUTHN_ID = 'password_based%3Abuilt_in_database';

interface EmqxAclRule {
  permission: 'allow' | 'deny';
  action: 'publish' | 'subscribe' | 'all';
  topic: string;
}

export interface EmqxClientPresence {
  connected: boolean;
  username: string;
  clientId?: string;
  connectedAt?: string;
}

@Injectable()
export class EmqxProvisionService {
  private readonly logger = new Logger(EmqxProvisionService.name);

  constructor(private readonly config: ConfigService) {}

  localServerMqttUsername(houseId: string): string {
    const short = houseId.replace(/-/g, '').slice(0, 12).toLowerCase();
    return `local-${short}`;
  }

  /** @deprecated use localServerMqttUsername */
  houseMqttUsername(houseId: string): string {
    return this.localServerMqttUsername(houseId);
  }

  generatePassword(): string {
    return randomBytes(18).toString('base64url');
  }

  /** Returns EMQX client session for a username (local-server MQTT login), if online. */
  async getClientPresence(username: string): Promise<EmqxClientPresence> {
    const trimmed = username.trim();
    if (!trimmed) {
      return { connected: false, username: trimmed };
    }

    try {
      const token = await this.login();
      const url = new URL(`${this.apiBase()}/api/v5/clients`);
      url.searchParams.set('username', trimmed);
      url.searchParams.set('limit', '1');

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        this.logger.warn(
          `EMQX clients lookup failed for ${trimmed} (${response.status})`,
        );
        return { connected: false, username: trimmed };
      }

      const body = (await response.json()) as {
        data?: Array<{ clientid?: string; connected_at?: string }>;
      };
      const client = body.data?.[0];
      if (!client) {
        return { connected: false, username: trimmed };
      }

      return {
        connected: true,
        username: trimmed,
        clientId: client.clientid,
        connectedAt: client.connected_at,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`EMQX clients lookup error for ${trimmed}: ${message}`);
      return { connected: false, username: trimmed };
    }
  }

  async provisionHouseUser(houseId: string, username: string, password: string): Promise<void> {
    const token = await this.login();
    await this.upsertUser(token, username, password);
    await this.applyHouseAcl(token, username, houseId);
    this.logger.log(`[${houseId}] EMQX user provisioned: ${username}`);
  }

  /** Ensures scenario-service MQTT credentials exist in EMQX (idempotent). */
  async ensureScenarioServiceUser(username: string, password: string): Promise<void> {
    const token = await this.login();
    await this.upsertUser(token, username, password);
    await this.applyScenarioServiceAcl(token, username);
    this.logger.log(`EMQX scenario-service user ensured: ${username}`);
  }

  private apiBase(): string {
    return (this.config.get<string>('EMQX_API_URL') ?? 'http://mqtt-gateway:18083')
      .trim()
      .replace(/\/+$/, '');
  }

  private adminPassword(): string {
    const password = this.config.get<string>('EMQX_DASHBOARD_PASSWORD')?.trim();
    if (!password) {
      throw new ServiceUnavailableException(
        'EMQX_DASHBOARD_PASSWORD is not configured — cannot provision MQTT credentials',
      );
    }
    return password;
  }

  private async login(): Promise<string> {
    const adminUser = this.config.get<string>('EMQX_ADMIN_USER')?.trim() || 'admin';
    const response = await fetch(`${this.apiBase()}/api/v5/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUser, password: this.adminPassword() }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new ServiceUnavailableException(
        `EMQX login failed (${response.status}): ${body || response.statusText}`,
      );
    }
    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      throw new ServiceUnavailableException('EMQX login response missing token');
    }
    return data.token;
  }

  private async upsertUser(token: string, username: string, password: string): Promise<void> {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const create = await fetch(
      `${this.apiBase()}/api/v5/authentication/${AUTHN_ID}/users`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: username, password }),
      },
    );
    if (create.ok) return;

    if (create.status === 409 || create.status === 400) {
      const update = await fetch(
        `${this.apiBase()}/api/v5/authentication/${AUTHN_ID}/users/${encodeURIComponent(username)}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ password }),
        },
      );
      if (update.ok) return;
      const body = await update.text();
      throw new ServiceUnavailableException(
        `EMQX user update failed (${update.status}): ${body || update.statusText}`,
      );
    }

    const body = await create.text();
    throw new ServiceUnavailableException(
      `EMQX user create failed (${create.status}): ${body || create.statusText}`,
    );
  }

  private scenarioServiceAclRules(): EmqxAclRule[] {
    return [
      { permission: 'allow', action: 'subscribe', topic: 'houses/+/zigbee2mqtt/#' },
      // Commands to local-server bridge (cloud → local zigbee2mqtt)
      { permission: 'allow', action: 'publish', topic: 'houses/+/cmd/zigbee2mqtt/#' },
      { permission: 'allow', action: 'subscribe', topic: 'modbus/response' },
      { permission: 'allow', action: 'publish', topic: 'modbus/command' },
    ];
  }

  private async applyScenarioServiceAcl(token: string, username: string): Promise<void> {
    await this.upsertAclRules(token, username, this.scenarioServiceAclRules(), 'scenario-service');
  }

  private houseAclRules(houseId: string): EmqxAclRule[] {
    const base = `houses/${houseId}`;
    return [
      { permission: 'allow', action: 'subscribe', topic: `${base}/zigbee2mqtt/#` },
      { permission: 'allow', action: 'publish', topic: `${base}/zigbee2mqtt/#` },
      { permission: 'allow', action: 'subscribe', topic: `${base}/cmd/zigbee2mqtt/#` },
      { permission: 'allow', action: 'publish', topic: `${base}/cmd/zigbee2mqtt/#` },
      { permission: 'allow', action: 'subscribe', topic: `${base}/status` },
      { permission: 'allow', action: 'publish', topic: `${base}/status` },
    ];
  }

  private async applyHouseAcl(token: string, username: string, houseId: string): Promise<void> {
    await this.upsertAclRules(token, username, this.houseAclRules(houseId), 'house');
  }

  /** Idempotent ACL upsert: PUT to update, POST to create, 409 = already exists. */
  private async upsertAclRules(
    token: string,
    username: string,
    rules: EmqxAclRule[],
    context: string,
  ): Promise<void> {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const payload = JSON.stringify({ rules });
    const put = await fetch(
      `${this.apiBase()}/api/v5/authorization/sources/built_in_database/rules/users/${encodeURIComponent(username)}`,
      { method: 'PUT', headers, body: payload },
    );
    if (put.ok || put.status === 409) return;

    const post = await fetch(
      `${this.apiBase()}/api/v5/authorization/sources/built_in_database/rules/users`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify([{ username, rules }]),
      },
    );
    if (post.ok || post.status === 409) return;

    const body = await post.text();
    throw new ServiceUnavailableException(
      `EMQX ${context} ACL failed (${post.status}): ${body || post.statusText}`,
    );
  }
}
