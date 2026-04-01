"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HousesModule = void 0;
const common_1 = require("@nestjs/common");
const houses_controller_1 = require("./houses.controller");
const houses_admin_controller_1 = require("./houses.admin.controller");
const houses_service_1 = require("./houses.service");
const house_roles_module_1 = require("../house-roles/house-roles.module");
let HousesModule = class HousesModule {
};
exports.HousesModule = HousesModule;
exports.HousesModule = HousesModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => house_roles_module_1.HouseRolesModule)],
        controllers: [houses_controller_1.HousesController, houses_admin_controller_1.HousesAdminController],
        providers: [houses_service_1.HousesService],
        exports: [houses_service_1.HousesService],
    })
], HousesModule);
