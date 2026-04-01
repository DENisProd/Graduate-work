"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOrCreateByExternalUserId(externalUserId, avatarUrl) {
        const existing = await this.prisma.user.findUnique({
            where: { externalUserId },
        });
        if (existing) {
            if (avatarUrl !== undefined) {
                return this.prisma.user.update({
                    where: { id: existing.id },
                    data: { avatarUrl },
                });
            }
            return existing;
        }
        try {
            return await this.prisma.user.create({
                data: { externalUserId, avatarUrl: avatarUrl ?? null },
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                const user = await this.prisma.user.findUnique({ where: { externalUserId } });
                if (user && avatarUrl !== undefined) {
                    return this.prisma.user.update({
                        where: { id: user.id },
                        data: { avatarUrl },
                    });
                }
                if (user)
                    return user;
            }
            throw e;
        }
    }
    async findByExternalUserId(externalUserId) {
        const user = await this.prisma.user.findUnique({
            where: { externalUserId },
        });
        if (!user) {
            throw new exceptions_1.ResourceNotFoundException('Пользователь', 'externalUserId', externalUserId);
        }
        return user;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new exceptions_1.ResourceNotFoundException('Пользователь', 'id', id);
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
