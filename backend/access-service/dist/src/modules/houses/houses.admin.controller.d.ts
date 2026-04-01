import { HousesService } from './houses.service';
import { HouseResponseDto } from './dto/house-response.dto';
export declare class HousesAdminController {
    private readonly housesService;
    constructor(housesService: HousesService);
    findAll(page?: string, size?: string, sort?: string): Promise<HouseResponseDto[]>;
    findByOwnerId(ownerId: string, page?: string, size?: string, sort?: string): Promise<HouseResponseDto[]>;
}
