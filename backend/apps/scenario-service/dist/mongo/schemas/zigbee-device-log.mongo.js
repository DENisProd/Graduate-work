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
exports.ZigbeeDeviceLogSchema = exports.ZigbeeDeviceLogModel = exports.ZigbeeDeviceLogKind = exports.ZigbeeDeviceLogSource = exports.ZIGBEE_DEVICE_LOG_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.ZIGBEE_DEVICE_LOG_MODEL = 'ZigbeeDeviceLog';
var ZigbeeDeviceLogSource;
(function (ZigbeeDeviceLogSource) {
    ZigbeeDeviceLogSource["Mqtt"] = "mqtt";
    ZigbeeDeviceLogSource["Api"] = "api";
})(ZigbeeDeviceLogSource || (exports.ZigbeeDeviceLogSource = ZigbeeDeviceLogSource = {}));
var ZigbeeDeviceLogKind;
(function (ZigbeeDeviceLogKind) {
    ZigbeeDeviceLogKind["StateIngest"] = "state_ingest";
    ZigbeeDeviceLogKind["BridgeEvent"] = "bridge_event";
})(ZigbeeDeviceLogKind || (exports.ZigbeeDeviceLogKind = ZigbeeDeviceLogKind = {}));
let ZigbeeDeviceLogModel = class ZigbeeDeviceLogModel {
    deviceIeeeAddr;
    physicalDeviceId;
    timestamp;
    source;
    kind;
    message;
    metrics;
    payloadKeys;
    stateDocumentId;
    metadata;
};
exports.ZigbeeDeviceLogModel = ZigbeeDeviceLogModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ZigbeeDeviceLogModel.prototype, "deviceIeeeAddr", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceLogModel.prototype, "physicalDeviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ZigbeeDeviceLogModel.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(ZigbeeDeviceLogSource),
        type: String,
    }),
    __metadata("design:type", String)
], ZigbeeDeviceLogModel.prototype, "source", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(ZigbeeDeviceLogKind),
        type: String,
    }),
    __metadata("design:type", String)
], ZigbeeDeviceLogModel.prototype, "kind", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceLogModel.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceLogModel.prototype, "metrics", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], ZigbeeDeviceLogModel.prototype, "payloadKeys", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceLogModel.prototype, "stateDocumentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], ZigbeeDeviceLogModel.prototype, "metadata", void 0);
exports.ZigbeeDeviceLogModel = ZigbeeDeviceLogModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'ZigbeeDeviceLog' })
], ZigbeeDeviceLogModel);
exports.ZigbeeDeviceLogSchema = mongoose_1.SchemaFactory.createForClass(ZigbeeDeviceLogModel);
exports.ZigbeeDeviceLogSchema.index({ deviceIeeeAddr: 1, timestamp: -1 });
exports.ZigbeeDeviceLogSchema.index({ physicalDeviceId: 1, timestamp: -1 });
//# sourceMappingURL=zigbee-device-log.mongo.js.map