import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateByExternalUserId(externalUserId: string, avatarUrl?: string): Promise<User>;
    findByExternalUserId(externalUserId: string): Promise<User>;
    findById(id: string): Promise<User>;
}
