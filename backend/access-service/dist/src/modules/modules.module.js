"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("./users/users.module");
const resources_module_1 = require("./resources/resources.module");
const permissions_module_1 = require("./permissions/permissions.module");
const policies_module_1 = require("./policies/policies.module");
const audit_module_1 = require("./audit/audit.module");
const access_evaluator_module_1 = require("./access-evaluator/access-evaluator.module");
const houses_module_1 = require("./houses/houses.module");
const house_members_module_1 = require("./house-members/house-members.module");
let ModulesModule = class ModulesModule {
};
exports.ModulesModule = ModulesModule;
exports.ModulesModule = ModulesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            houses_module_1.HousesModule,
            house_members_module_1.HouseMembersModule,
            resources_module_1.ResourcesModule,
            permissions_module_1.PermissionsModule,
            policies_module_1.PoliciesModule,
            audit_module_1.AuditModule,
            access_evaluator_module_1.AccessEvaluatorModule,
        ],
    })
], ModulesModule);
