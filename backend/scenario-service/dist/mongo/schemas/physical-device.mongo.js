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
exports.PhysicalDeviceSchema = exports.PhysicalDeviceModel = exports.PHYSICAL_DEVICE_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const zigbee_schemas_1 = require("../../zigbee/schemas/zigbee.schemas");
exports.PHYSICAL_DEVICE_MODEL = 'PhysicalDevice';
let PhysicalDeviceModel = class PhysicalDeviceModel {
    name;
    description;
    houseId;
    roomId;
    deviceId;
    protocolAddress;
    networkAddress;
    type;
    deviceTypeId;
    manufacturerName;
    model;
    friendlyName;
    firmwareVersion;
    lastSeen;
    definition;
    capabilities;
    createdAt;
    updatedAt;
};
exports.PhysicalDeviceModel = PhysicalDeviceModel;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "houseId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "roomId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "deviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "protocolAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "networkAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: Object.values(zigbee_schemas_1.ZigbeeDeviceType),
        default: zigbee_schemas_1.ZigbeeDeviceType.EndDevice,
        type: String,
    }),
    __metadata("design:type", String)
], PhysicalDeviceModel.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "deviceTypeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "manufacturerName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "model", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "friendlyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "firmwareVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "lastSeen", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], PhysicalDeviceModel.prototype, "definition", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], PhysicalDeviceModel.prototype, "capabilities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PhysicalDeviceModel.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PhysicalDeviceModel.prototype, "updatedAt", void 0);
exports.PhysicalDeviceModel = PhysicalDeviceModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'PhysicalDevice' })
], PhysicalDeviceModel);
exports.PhysicalDeviceSchema = mongoose_1.SchemaFactory.createForClass(PhysicalDeviceModel);
exports.PhysicalDeviceSchema.index({ protocolAddress: 1 }, { unique: true, sparse: true });
//# sourceMappingURL=physical-device.mongo.js.map