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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceDataSchema = exports.DeviceDataModel = exports.DEVICE_DATA_MODEL = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/schemas/enums");
exports.DEVICE_DATA_MODEL = 'DeviceData';
let DeviceDataModel = class DeviceDataModel {
    deviceId;
    capability;
    attribute;
    type;
    value;
    unit;
    quality;
    timestamp;
};
exports.DeviceDataModel = DeviceDataModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", typeof (_a = typeof mongoose_2.Types !== "undefined" && mongoose_2.Types.ObjectId) === "function" ? _a : Object)
], DeviceDataModel.prototype, "deviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String }),
    __metadata("design:type", String)
], DeviceDataModel.prototype, "capability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], DeviceDataModel.prototype, "attribute", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(enums_1.DeviceDataType) }),
    __metadata("design:type", String)
], DeviceDataModel.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Object }),
    __metadata("design:type", Object)
], DeviceDataModel.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], DeviceDataModel.prototype, "unit", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DeviceDataModel.prototype, "quality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], DeviceDataModel.prototype, "timestamp", void 0);
exports.DeviceDataModel = DeviceDataModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'DeviceData' })
], DeviceDataModel);
exports.DeviceDataSchema = mongoose_1.SchemaFactory.createForClass(DeviceDataModel);
exports.DeviceDataSchema.index({ deviceId: 1, capability: 1, timestamp: -1 });
exports.DeviceDataSchema.index({ deviceId: 1, timestamp: -1 });
exports.DeviceDataSchema.index({ capability: 1, timestamp: -1 });
//# sourceMappingURL=device-data.mongo.js.map