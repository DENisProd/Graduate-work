import { AccessRightType, PolicySubjectType } from '@prisma/client';
export declare class CreatePolicyDto {
    name: string;
    effect: AccessRightType;
    subjectType: PolicySubjectType;
    subjectId?: string;
    resourceId: string;
    condition?: Record<string, unknown>;
    priority: number;
}
