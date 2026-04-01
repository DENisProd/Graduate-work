import { PrismaService } from '../../prisma/prisma.service';
import { AccessRightType } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';
import { AccessCheckDto } from './dto/access-check.dto';
import { AccessCheckByDeviceDto } from './dto/access-check-by-device.dto';
import { HouseMembersService } from 'src/modules/house-members/house-members.service';
type Decision = {
    allowed: boolean;
    source: 'EFFECTIVE' | 'ACCESS_RIGHT' | 'POLICY' | 'NONE';
    rightType?: AccessRightType;
};
export declare class AccessEvaluatorService {
    private readonly prisma;
    private readonly resourcesService;
    private readonly usersService;
    private readonly membersService;
    constructor(prisma: PrismaService, resourcesService: ResourcesService, usersService: UsersService, membersService: HouseMembersService);
    private actionAllowedByType;
    private sortBySpecificity;
    private decideFromList;
    check(dto: AccessCheckDto): Promise<Decision>;
    checkByDeviceFunction(dto: AccessCheckByDeviceDto): Promise<{
        allow: boolean;
        deny: boolean;
    }>;
}
export {};
