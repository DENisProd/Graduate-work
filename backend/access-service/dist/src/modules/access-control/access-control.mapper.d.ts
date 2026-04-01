import { HouseAccessRightResponseDto } from './dto/house-access-right-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { Prisma } from '@prisma/client';
export type RightWithRelations = Prisma.AccessRightGetPayload<{
    include: {
        resource: {
            include: {
                house: true;
            };
        };
        houseMember: {
            include: {
                user: true;
            };
        };
        role: true;
        grantedBy: true;
    };
}>;
export declare function toHouseAccessRightResponse(r: RightWithRelations): HouseAccessRightResponseDto;
export declare function toHouseAccessRightPageResponse(content: RightWithRelations[], page: number, size: number, total: number): PageResponseDto<HouseAccessRightResponseDto>;
