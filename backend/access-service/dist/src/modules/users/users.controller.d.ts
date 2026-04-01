import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto): Promise<UserResponseDto>;
    findById(id: string): Promise<UserResponseDto>;
    findByExternalId(externalUserId: string): Promise<UserResponseDto>;
}
