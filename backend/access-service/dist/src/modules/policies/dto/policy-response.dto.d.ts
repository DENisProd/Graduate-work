import { AccessRightType, PolicySubjectType } from '@prisma/client';
export declare class PolicyResponseDto {
    id: string;
    houseId: string;
    name: string;
    effect: AccessRightType;
    subjectType: PolicySubjectType;
    subjectId?: string;
    resourceId?: string;
    condition?: Record<string, unknown>;
    priority: number;
    createdAt: string;
}
