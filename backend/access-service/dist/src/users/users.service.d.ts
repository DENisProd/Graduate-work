import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateByUserId(userId: string): Promise<User>;
    findByUserId(userId: string): Promise<User>;
    findById(id: string): Promise<User>;
}
