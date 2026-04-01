import { HousesService } from './houses.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { HouseRequestDto } from './dto/house-request.dto';
import { HouseUpdateRequestDto } from './dto/house-update-request.dto';
import { HouseResponseDto } from './dto/house-response.dto';
export declare class HousesController {
    private readonly housesService;
    private readonly houseRolesService;
    constructor(housesService: HousesService, houseRolesService: HouseRolesService);
    findByUserId(userId: string, page?: string, size?: string, sort?: string): Promise<HouseResponseDto[]>;
    findById(id: string): Promise<HouseResponseDto>;
    create(dto: HouseRequestDto): Promise<HouseResponseDto>;
    update(id: string, dto: HouseUpdateRequestDto): Promise<HouseResponseDto>;
    delete(id: string): Promise<void>;
}
