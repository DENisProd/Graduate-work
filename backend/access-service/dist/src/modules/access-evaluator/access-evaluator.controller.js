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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessEvaluatorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const access_evaluator_service_1 = require("./access-evaluator.service");
const access_check_dto_1 = require("./dto/access-check.dto");
const access_check_by_device_dto_1 = require("./dto/access-check-by-device.dto");
const access_decision_response_dto_1 = require("./dto/access-decision-response.dto");
const device_access_check_response_dto_1 = require("./dto/device-access-check-response.dto");
let AccessEvaluatorController = class AccessEvaluatorController {
    constructor(accessEvaluatorService) {
        this.accessEvaluatorService = accessEvaluatorService;
    }
    async check(dto) {
        return this.accessEvaluatorService.check(dto);
    }
    async checkByDevice(dto) {
        return this.accessEvaluatorService.checkByDeviceFunction(dto);
    }
};
exports.AccessEvaluatorController = AccessEvaluatorController;
__decorate([
    (0, common_1.Post)('access/check'),
    (0, swagger_1.ApiOperation)({
        summary: 'Проверка доступа к ресурсу',
        description: 'Оценка по цепочке ресурса: эффективные права → явные права → политики ABAC.',
    }),
    (0, swagger_1.ApiBody)({ type: access_check_dto_1.AccessCheckDto }),
    (0, swagger_1.ApiOkResponse)({ type: access_decision_response_dto_1.AccessDecisionResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_check_dto_1.AccessCheckDto]),
    __metadata("design:returntype", Promise)
], AccessEvaluatorController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('access-check'),
    (0, swagger_1.ApiOperation)({
        summary: 'Проверка доступа к функции устройства',
        description: 'По `deviceFunctionId` находится ресурс типа DEVICE_FUNCTION, затем выполняется та же проверка, что и для `access/check`.',
    }),
    (0, swagger_1.ApiBody)({ type: access_check_by_device_dto_1.AccessCheckByDeviceDto }),
    (0, swagger_1.ApiOkResponse)({ type: device_access_check_response_dto_1.DeviceAccessCheckResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_check_by_device_dto_1.AccessCheckByDeviceDto]),
    __metadata("design:returntype", Promise)
], AccessEvaluatorController.prototype, "checkByDevice", null);
exports.AccessEvaluatorController = AccessEvaluatorController = __decorate([
    (0, swagger_1.ApiTags)('Access Evaluation'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [access_evaluator_service_1.AccessEvaluatorService])
], AccessEvaluatorController);
