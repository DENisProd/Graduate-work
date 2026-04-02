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
exports.ZigbeeStateSchema = exports.ZigbeeDeviceStateModel = exports.ZIGBEE_STATE_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.ZIGBEE_STATE_MODEL = 'ZigbeeDeviceState';
let ZigbeeDeviceStateModel = class ZigbeeDeviceStateModel {
    deviceIeeeAddr;
    timestamp;
    payload;
    state;
    brightness;
    linkquality;
    colorMode;
    occupancy;
    temperature;
    humidity;
    battery;
};
exports.ZigbeeDeviceStateModel = ZigbeeDeviceStateModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ZigbeeDeviceStateModel.prototype, "deviceIeeeAddr", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ZigbeeDeviceStateModel.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Object }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "payload", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "brightness", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "linkquality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "colorMode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "occupancy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "temperature", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "humidity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceStateModel.prototype, "battery", void 0);
exports.ZigbeeDeviceStateModel = ZigbeeDeviceStateModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'ZigbeeDeviceState' })
], ZigbeeDeviceStateModel);
exports.ZigbeeStateSchema = mongoose_1.SchemaFactory.createForClass(ZigbeeDeviceStateModel);
exports.ZigbeeStateSchema.index({ deviceIeeeAddr: 1, timestamp: -1 });
//# sourceMappingURL=zigbee-state.mongo.js.map