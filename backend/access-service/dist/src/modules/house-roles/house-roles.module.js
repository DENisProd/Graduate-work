"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseRolesModule = void 0;
const common_1 = require("@nestjs/common");
const house_roles_controller_1 = require("./house-roles.controller");
const house_roles_service_1 = require("./house-roles.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const houses_module_1 = require("../houses/houses.module");
let HouseRolesModule = class HouseRolesModule {
};
exports.HouseRolesModule = HouseRolesModule;
exports.HouseRolesModule = HouseRolesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, (0, common_1.forwardRef)(() => houses_module_1.HousesModule)],
        controllers: [house_roles_controller_1.HouseRolesController],
        providers: [house_roles_service_1.HouseRolesService],
        exports: [house_roles_service_1.HouseRolesService],
    })
], HouseRolesModule);
