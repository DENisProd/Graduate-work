import { PrismaService } from '../../prisma/prisma.service';
export type HealthStatus = 'ok' | 'error';
export interface HealthResult {
    status: HealthStatus;
    database?: 'connected' | 'disconnected';
    timestamp: string;
}
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<HealthResult>;
}
