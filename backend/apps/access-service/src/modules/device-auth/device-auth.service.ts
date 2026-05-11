import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

type DeviceAuthStatus = 'pending' | 'authorized' | 'denied' | 'expired';

interface DeviceAuthSession {
  id: string;
  userCode: string;
  callbackUrl?: string;
  createdAt: Date;
  expiresAt: Date;
  lastPolledAt?: Date;
  pollInterval: number;
  status: DeviceAuthStatus;
  authCode?: string;
  externalUserId?: string;
  displayName?: string;
  authorizedAt?: Date;
}

@Injectable()
export class DeviceAuthService {
  private readonly sessions = new Map<string, DeviceAuthSession>();
  private readonly userCodeIndex = new Map<string, string>();
  private readonly expiresInSec = 300;
  private readonly pollIntervalSec = 3;
  private readonly verificationUrlBase =
    process.env.DEVICE_AUTH_VERIFICATION_URL?.trim() || 'http://localhost:3000/device-auth';

  createSession(callbackUrl?: string) {
    const id = randomUUID();
    const userCode = this.generateUserCode();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.expiresInSec * 1000);
    const session: DeviceAuthSession = {
      id,
      userCode,
      callbackUrl,
      createdAt,
      expiresAt,
      pollInterval: this.pollIntervalSec,
      status: 'pending',
    };
    this.sessions.set(id, session);
    this.userCodeIndex.set(userCode, id);
    const verificationUrl = this.buildVerificationUrl(userCode, id);
    return {
      authSessionId: id,
      userCode,
      verificationUrl,
      expiresIn: this.expiresInSec,
      pollInterval: this.pollIntervalSec,
    };
  }

  pollSession(sessionId: string) {
    const session = this.getSession(sessionId);
    this.markExpiredIfNeeded(session);
    session.lastPolledAt = new Date();
    this.sessions.set(session.id, session);
    return {
      status: session.status,
      authCode: session.status === 'authorized' ? session.authCode : undefined,
      externalUserId: session.status === 'authorized' ? session.externalUserId : undefined,
      displayName: session.status === 'authorized' ? session.displayName : undefined,
    };
  }

  async completeByUserCode(
    userCode: string,
    externalUserId: string,
    displayName?: string,
  ): Promise<void> {
    const sessionId = this.userCodeIndex.get(userCode);
    if (!sessionId) {
      throw new NotFoundException('Сессия авторизации не найдена по userCode');
    }
    const session = this.getSession(sessionId);
    this.markExpiredIfNeeded(session);
    if (session.status !== 'pending') {
      throw new BadRequestException(`Сессия в статусе ${session.status}, завершение невозможно`);
    }

    const authCode = randomUUID();
    session.status = 'authorized';
    session.authCode = authCode;
    session.externalUserId = externalUserId;
    session.displayName = displayName;
    session.authorizedAt = new Date();
    this.sessions.set(session.id, session);

    if (session.callbackUrl) {
      await this.sendCallback(session.callbackUrl, {
        authSessionId: session.id,
        status: 'authorized',
        authCode,
        externalUserId,
        displayName,
      });
    }
  }

  listConnectedServers(externalUserId: string) {
    return Array.from(this.sessions.values())
      .filter((session) => session.status === 'authorized' && session.externalUserId === externalUserId)
      .map((session) => ({
        id: session.id,
        status: session.status,
        userCode: session.userCode,
        displayName: session.displayName,
        externalUserId: session.externalUserId,
        authorizedAt: session.authorizedAt?.toISOString() ?? null,
        lastSeenAt: session.lastPolledAt?.toISOString() ?? null,
      }))
      .sort((a, b) => {
        const aa = a.authorizedAt ? new Date(a.authorizedAt).getTime() : 0;
        const bb = b.authorizedAt ? new Date(b.authorizedAt).getTime() : 0;
        return bb - aa;
      });
  }

  logoutSession(sessionId: string) {
    const session = this.getSession(sessionId);
    session.status = 'denied';
    session.authCode = undefined;
    this.sessions.set(session.id, session);
    return { status: session.status };
  }

  private getSession(sessionId: string): DeviceAuthSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Сессия авторизации ${sessionId} не найдена`);
    }
    return session;
  }

  private markExpiredIfNeeded(session: DeviceAuthSession): void {
    if (session.status === 'pending' && session.expiresAt.getTime() < Date.now()) {
      session.status = 'expired';
      this.sessions.set(session.id, session);
    }
  }

  private generateUserCode(): string {
    return Math.random().toString(36).slice(2, 6).toUpperCase()
      + '-'
      + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  private async sendCallback(url: string, payload: unknown): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Callback is best-effort for NAT setups, so we only log.
        // eslint-disable-next-line no-console
        console.warn(`device-auth callback failed: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('device-auth callback error', error);
    }
  }

  private buildVerificationUrl(userCode: string, sessionId: string): string {
    try {
      const url = new URL(this.verificationUrlBase);
      url.searchParams.set('userCode', userCode);
      url.searchParams.set('sessionId', sessionId);
      return url.toString();
    } catch {
      return this.verificationUrlBase;
    }
  }
}
