"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseMembersModule = void 0;
const common_1 = require("@nestjs/common");
const house_members_controller_1 = require("./house-members.controller");
const house_members_service_1 = require("./house-members.service");
const houses_module_1 = require("../houses/houses.module");
const house_roles_module_1 = require("../house-roles/house-roles.module");
let HouseMembersModule = class HouseMembersModule {
};
exports.HouseMembersModule = HouseMembersModule;
exports.HouseMembersModule = HouseMembersModule = __decorate([
    (0, common_1.Module)({
        imports: [houses_module_1.HousesModule, house_roles_module_1.HouseRolesModule],
        controllers: [house_members_controller_1.HouseMembersController],
        providers: [house_members_service_1.HouseMembersService],
        exports: [house_members_service_1.HouseMembersService],
    })
], HouseMembersModule);
