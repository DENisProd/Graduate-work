"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseInvitationsModule = void 0;
const common_1 = require("@nestjs/common");
const house_invitations_controller_1 = require("./house-invitations.controller");
const house_invitations_service_1 = require("./house-invitations.service");
const houses_module_1 = require("../houses/houses.module");
const house_members_module_1 = require("../house-members/house-members.module");
const house_roles_module_1 = require("../house-roles/house-roles.module");
let HouseInvitationsModule = class HouseInvitationsModule {
};
exports.HouseInvitationsModule = HouseInvitationsModule;
exports.HouseInvitationsModule = HouseInvitationsModule = __decorate([
    (0, common_1.Module)({
        imports: [houses_module_1.HousesModule, house_members_module_1.HouseMembersModule, house_roles_module_1.HouseRolesModule],
        controllers: [house_invitations_controller_1.HouseInvitationsController],
        providers: [house_invitations_service_1.HouseInvitationsService],
        exports: [house_invitations_service_1.HouseInvitationsService],
    })
], HouseInvitationsModule);
