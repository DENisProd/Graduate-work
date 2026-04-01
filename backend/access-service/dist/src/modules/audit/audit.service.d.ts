import { PrismaService } from '../../prisma/prisma.service';
import { AccessAuditLog } from '@prisma/client';
export declare const AUDIT_ACTIONS: {
    readonly ROLE_CREATED: "ROLE_CREATED";
    readonly ROLE_DELETED: "ROLE_DELETED";
    readonly MEMBER_ADDED: "MEMBER_ADDED";
    readonly ACCESS_GRANTED: "ACCESS_GRANTED";
    readonly POLICY_CREATED: "POLICY_CREATED";
    readonly INVITATION_CREATED: "INVITATION_CREATED";
    readonly INVITATION_ACCEPTED: "INVITATION_ACCEPTED";
    readonly INVITATION_REVOKED: "INVITATION_REVOKED";
};
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(actorId: string, action: string, resourceId?: string | null, metadata?: Record<string, unknown> | null): Promise<AccessAuditLog>;
    findAll(params: {
        actorId?: string;
        resourceId?: string;
        action?: string;
        page?: number;
        size?: number;
    }): Promise<{
        content: AccessAuditLog[];
        total: number;
    }>;
}
