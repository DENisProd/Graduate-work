export declare class AuditLogResponseDto {
    id: string;
    actorId: string;
    action: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}
