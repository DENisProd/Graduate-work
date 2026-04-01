"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsModule = void 0;
const common_1 = require("@nestjs/common");
const permissions_service_1 = require("./permissions.service");
const permissions_controller_1 = require("./permissions.controller");
const resources_module_1 = require("../resources/resources.module");
const users_module_1 = require("../users/users.module");
const house_roles_module_1 = require("../house-roles/house-roles.module");
const house_members_module_1 = require("../house-members/house-members.module");
let PermissionsModule = class PermissionsModule {
};
exports.PermissionsModule = PermissionsModule;
exports.PermissionsModule = PermissionsModule = __decorate([
    (0, common_1.Module)({
        imports: [resources_module_1.ResourcesModule, house_members_module_1.HouseMembersModule, house_roles_module_1.HouseRolesModule, users_module_1.UsersModule],
        controllers: [permissions_controller_1.PermissionsController],
        providers: [permissions_service_1.PermissionsService],
    })
], PermissionsModule);
