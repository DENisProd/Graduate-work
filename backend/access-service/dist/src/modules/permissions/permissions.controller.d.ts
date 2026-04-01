import { PermissionsService } from './permissions.service';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { AccessRightResponseDto } from './dto/access-right-response.dto';
import { AccessStructureResponseDto } from './dto/access-structure-response.dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(dto: CreateAccessRightDto, grantedByUserId: string): Promise<AccessRightResponseDto>;
    getByResource(resourceId: string): Promise<AccessRightResponseDto[]>;
    getByUser(id: string): Promise<AccessRightResponseDto[]>;
    delete(id: string): Promise<void>;
    rebuildCache(): Promise<void>;
    getAccessStructure(userId: string): Promise<AccessStructureResponseDto>;
}
