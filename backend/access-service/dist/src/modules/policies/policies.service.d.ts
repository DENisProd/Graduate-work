import { PrismaService } from '../../prisma/prisma.service';
import { AccessPolicy } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { AuditService } from '../audit/audit.service';
export declare class PoliciesService {
    private readonly prisma;
    private readonly resourcesService;
    private readonly auditService;
    constructor(prisma: PrismaService, resourcesService: ResourcesService, auditService: AuditService);
    create(dto: CreatePolicyDto, actorId?: string): Promise<AccessPolicy>;
    findByHouseId(houseId: string): Promise<AccessPolicy[]>;
    delete(id: string): Promise<void>;
}
