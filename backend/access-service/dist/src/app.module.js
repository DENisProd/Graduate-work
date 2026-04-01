"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const health_module_1 = require("./modules/health/health.module");
const modules_module_1 = require("./modules/modules.module");
const users_module_1 = require("./users/users.module");
const houses_module_1 = require("./modules/houses/houses.module");
const access_control_module_1 = require("./modules/access-control/access-control.module");
const house_members_module_1 = require("./modules/house-members/house-members.module");
const house_rooms_module_1 = require("./modules/house-rooms/house-rooms.module");
const house_invitations_module_1 = require("./modules/house-invitations/house-invitations.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 10 },
                { name: 'medium', ttl: 10000, limit: 50 },
                { name: 'long', ttl: 60000, limit: 200 },
            ]),
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            health_module_1.HealthModule,
            houses_module_1.HousesModule,
            house_members_module_1.HouseMembersModule,
            house_rooms_module_1.HouseRoomsModule,
            house_invitations_module_1.HouseInvitationsModule,
            access_control_module_1.AccessControlModule,
            modules_module_1.ModulesModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
