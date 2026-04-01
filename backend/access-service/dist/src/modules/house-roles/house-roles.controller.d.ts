import { HouseRolesService } from './house-roles.service';
import { CreateHouseRoleRequestDto, HouseRoleResponseDto } from './dto/house-role.dto';
export declare class HouseRolesController {
    private readonly houseRolesService;
    constructor(houseRolesService: HouseRolesService);
    findByHouseId(houseId: string): Promise<HouseRoleResponseDto[]>;
    create(houseId: string, dto: CreateHouseRoleRequestDto, editorUserId: string): Promise<HouseRoleResponseDto>;
    delete(roleId: string): Promise<void>;
    assignRole(memberId: string, roleId: string, editorUserId: string): Promise<void>;
    unassignRole(memberId: string, roleId: string, editorUserId: string): Promise<void>;
}
