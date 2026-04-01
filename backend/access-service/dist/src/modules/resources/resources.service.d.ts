import { PrismaService } from '../../prisma/prisma.service';
import { Resource } from '@prisma/client';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ResourceTreeNodeDto } from './dto/resource-tree-node.dto';
export declare class ResourcesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRootForHouse(houseId: string): Promise<{
        id: string;
    }>;
    create(dto: CreateResourceDto): Promise<Resource>;
    findById(id: string): Promise<Resource>;
    update(id: string, data: {
        name?: string | null;
        externalId?: string | null;
    }): Promise<Resource>;
    delete(id: string): Promise<void>;
    findDeviceFunctionByExternalOrId(deviceFunctionId: string): Promise<Resource>;
    getTreeByHouseId(houseId: string): Promise<ResourceTreeNodeDto[]>;
}
