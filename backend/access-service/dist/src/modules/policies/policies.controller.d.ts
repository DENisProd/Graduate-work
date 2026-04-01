import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyResponseDto } from './dto/policy-response.dto';
export declare class PoliciesController {
    private readonly policiesService;
    constructor(policiesService: PoliciesService);
    create(dto: CreatePolicyDto, actorId: string): Promise<PolicyResponseDto>;
    findByHouseId(houseId: string): Promise<PolicyResponseDto[]>;
    delete(id: string): Promise<void>;
}
