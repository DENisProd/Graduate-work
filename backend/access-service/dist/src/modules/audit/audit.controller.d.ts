import { AuditService } from './audit.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(actorId?: string, resourceId?: string, action?: string, page?: string, size?: string): Promise<{
        content: AuditLogResponseDto[];
        total: number;
    }>;
}
