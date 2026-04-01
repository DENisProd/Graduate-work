import { HouseInvitationsService } from './house-invitations.service';
import { HouseInvitationRequestDto } from './dto/house-invitation-request.dto';
import { HouseInvitationResponseDto } from './dto/house-invitation-response.dto';
export declare class HouseInvitationsController {
    private readonly houseInvitationsService;
    constructor(houseInvitationsService: HouseInvitationsService);
    findByToken(token: string): Promise<HouseInvitationResponseDto>;
    findByHouseId(houseId: string, page?: string, size?: string, sort?: string, includeAll?: string): Promise<HouseInvitationResponseDto[]>;
    create(dto: HouseInvitationRequestDto, invitedById: string): Promise<HouseInvitationResponseDto>;
    accept(token: string, userId: string): Promise<HouseInvitationResponseDto>;
    decline(token: string): Promise<HouseInvitationResponseDto>;
    revoke(id: string, userId: string): Promise<HouseInvitationResponseDto>;
}
