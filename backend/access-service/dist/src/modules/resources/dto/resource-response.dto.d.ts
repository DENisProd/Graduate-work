import { ResourceType } from '@prisma/client';
export declare class ResourceResponseDto {
    id: string;
    houseId: string;
    type: ResourceType;
    externalId?: string;
    parentId?: string;
    path: string;
    depth: number;
    createdAt: string;
}
