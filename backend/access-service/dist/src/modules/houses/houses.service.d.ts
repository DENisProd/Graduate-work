import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../users/users.service';
import { HouseRequestDto } from './dto/house-request.dto';
import { HouseUpdateRequestDto } from './dto/house-update-request.dto';
import { House, User } from '@prisma/client';
import { HouseRolesService } from '../house-roles/house-roles.service';
type HouseWithOwner = House & {
    owner: User;
};
export declare class HousesService {
    private readonly prisma;
    private readonly userService;
    private readonly houseRolesService;
    constructor(prisma: PrismaService, userService: UserService, houseRolesService: HouseRolesService);
    findById(id: string): Promise<HouseWithOwner>;
    findByOwnerId(ownerId: string, page: number, size: number, sort: string): Promise<{
        content: HouseWithOwner[];
        total: number;
    }>;
    findAll(page: number, size: number, sort: string): Promise<{
        content: HouseWithOwner[];
        total: number;
    }>;
    create(dto: HouseRequestDto): Promise<HouseWithOwner>;
    update(id: string, dto: HouseUpdateRequestDto): Promise<HouseWithOwner>;
    delete(id: string): Promise<void>;
    isOwner(houseId: string, userId: string): Promise<boolean>;
}
export {};
