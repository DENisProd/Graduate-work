import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const PENDING_TTL_SEC = 300;
const AUTHORIZED_TTL_DAYS = 30;

@Injectable()
export class DeviceAuthService {
  private readonly pollIntervalSec = 3;
  private readonly verificationUrlBase =
    process.env.DEVICE_AUTH_VERIFICATION_URL?.trim() || 'http://localhost:3000/device-auth';

  constructor(private readonly prisma: PrismaService) {}

  async createSession(callbackUrl?: string, serialNumber?: string) {
    const id = randomUUID();
    const userCode = this.generateUserCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PENDING_TTL_SEC * 1000);

    await this.prisma.deviceAuthSession.create({
      data: { id, userCode, callbackUrl, serialNumber, status: 'pending', expiresAt },
    });

    return {
      authSessionId: id,
      userCode,
      verificationUrl: this.buildVerificationUrl(userCode, id),
      expiresIn: PENDING_TTL_SEC,
      pollInterval: this.pollIntervalSec,
    };
  }

  async pollSession(sessionId: string) {
    const session = await this.findOrThrow(sessionId);

    let status = session.status;
    if (session.status === 'pending' && session.expiresAt.getTime() < Date.now()) {
      status = 'expired';
    }

    await this.prisma.deviceAuthSession.update({
      where: { id: sessionId },
      data: { lastPolledAt: new Date(), ...(status === 'expired' ? { status } : {}) },
    });

    return {
      status,
      authCode: status === 'authorized' ? session.authCode : undefined,
      externalUserId: status === 'authorized' ? session.externalUserId : undefined,
      displayName: status === 'authorized' ? session.displayName : undefined,
    };
  }

  async completeByUserCode(
    userCode: string,
    externalUserId: string,
    displayName?: string,
  ): Promise<void> {
    const session = await this.prisma.deviceAuthSession.findUnique({ where: { userCode } });
    if (!session) throw new NotFoundException('Сессия авторизации не найдена по userCode');

    const isExpired = session.status === 'pending' && session.expiresAt.getTime() < Date.now();
    const effectiveStatus = isExpired ? 'expired' : session.status;
    if (effectiveStatus !== 'pending') {
      throw new BadRequestException(`Сессия в статусе ${effectiveStatus}, завершение невозможно`);
    }

    const authCode = randomUUID();
    const authorizedExpiresAt = new Date(Date.now() + AUTHORIZED_TTL_DAYS * 24 * 3600 * 1000);

    await this.prisma.deviceAuthSession.update({
      where: { id: session.id },
      data: {
        status: 'authorized',
        authCode,
        externalUserId,
        displayName,
        authorizedAt: new Date(),
        expiresAt: authorizedExpiresAt,
      },
    });

    if (session.callbackUrl) {
      await this.sendCallback(session.callbackUrl, {
        authSessionId: session.id,
        status: 'authorized',
        authCode,
        externalUserId,
        displayName,
        expiresAt: authorizedExpiresAt.toISOString(),
      });
    }
  }

  async listConnectedServers(externalUserId: string) {
    const sessions = await this.prisma.deviceAuthSession.findMany({
      where: { externalUserId, status: 'authorized', expiresAt: { gt: new Date() } },
      orderBy: { authorizedAt: 'desc' },
    });

    // Deduplicate by serialNumber — keep the most recently authorized session per serial.
    // Sessions without a serial number are never deduplicated.
    const seen = new Set<string>();
    const deduped = sessions.filter((s) => {
      if (!s.serialNumber) return true;
      if (seen.has(s.serialNumber)) return false;
      seen.add(s.serialNumber);
      return true;
    });

    return deduped.map((s) => ({
      id: s.id,
      status: s.status,
      userCode: s.userCode,
      displayName: s.displayName,
      serialNumber: s.serialNumber ?? null,
      externalUserId: s.externalUserId,
      authorizedAt: s.authorizedAt?.toISOString() ?? null,
      lastSeenAt: s.lastPolledAt?.toISOString() ?? null,
    }));
  }

  async validateToken(authCode: string): Promise<{ valid: boolean; externalUserId?: string; displayName?: string }> {
    const session = await this.prisma.deviceAuthSession.findFirst({
      where: { authCode, status: 'authorized', expiresAt: { gt: new Date() } },
    });
    if (!session) return { valid: false };
    await this.prisma.deviceAuthSession.update({
      where: { id: session.id },
      data: { lastPolledAt: new Date() },
    });
    return {
      valid: true,
      externalUserId: session.externalUserId ?? undefined,
      displayName: session.displayName ?? undefined,
    };
  }

  async logoutSession(sessionId: string) {
    const session = await this.findOrThrow(sessionId);
    await this.prisma.deviceAuthSession.update({
      where: { id: session.id },
      data: { status: 'denied', authCode: null },
    });
    return { status: 'denied' };
  }

  private async findOrThrow(sessionId: string) {
    const session = await this.prisma.deviceAuthSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Сессия авторизации ${sessionId} не найдена`);
    return session;
  }

  private generateUserCode(): string {
    return (
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  }

  private async sendCallback(url: string, payload: unknown): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn(`device-auth callback failed: ${res.status} ${res.statusText}`);
      }
    } catch (error) {
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
