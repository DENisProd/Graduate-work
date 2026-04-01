import { ResourceType } from '@prisma/client';
export declare class CreateResourceDto {
    type: ResourceType;
    parentId: string;
    name?: string;
    externalId?: string;
}
