import { ResourceType } from '@prisma/client';
export declare class ResourceTreeNodeDto {
    id: string;
    houseId: string;
    type: ResourceType;
    name?: string;
    externalId?: string;
    parentId?: string;
    path: string;
    depth: number;
    createdAt: string;
    children: ResourceTreeNodeDto[];
}
