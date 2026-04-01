import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type HealthStatus = 'ok' | 'error';

export interface HealthResult {
  status: HealthStatus;
  database?: 'connected' | 'disconnected';
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResult> {
    const timestamp = new Date().toISOString();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp,
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp,
      };
    }
  }
}

