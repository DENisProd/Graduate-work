import { AccessControlService } from './access-control.service';
import { HouseAccessRightRequestDto } from './dto/house-access-right-request.dto';
import { AccessCheckRequestDto } from './dto/access-check-request.dto';
import { AccessCheckResponseDto } from './dto/access-check-response.dto';
import { HouseAccessRightResponseDto } from './dto/house-access-right-response.dto';
export declare class AccessControlController {
    private readonly accessControlService;
    constructor(accessControlService: AccessControlService);
    createRight(dto: HouseAccessRightRequestDto, grantedByUserId: string): Promise<HouseAccessRightResponseDto>;
    updateRight(id: string, dto: HouseAccessRightRequestDto, userId: string): Promise<HouseAccessRightResponseDto>;
    deleteRight(id: string, userId: string): Promise<void>;
    getRightsByMember(memberId: string, page?: string, size?: string, sort?: string): Promise<import("../common/dto/page-response.dto").PageResponseDto<HouseAccessRightResponseDto>>;
    getRightsByHouse(houseId: string, page?: string, size?: string, sort?: string): Promise<import("../common/dto/page-response.dto").PageResponseDto<HouseAccessRightResponseDto>>;
    checkAccess(dto: AccessCheckRequestDto): Promise<AccessCheckResponseDto>;
    cleanupExpired(): Promise<void>;
}
