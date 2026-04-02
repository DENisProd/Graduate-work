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
exports.DeviceNetworkLinkSchema = exports.DeviceNetworkLinkModel = exports.DEVICE_NETWORK_LINK_MODEL = exports.Protocol = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var Protocol;
(function (Protocol) {
    Protocol["Zigbee"] = "Zigbee";
    Protocol["ZWave"] = "ZWave";
    Protocol["Matter"] = "Matter";
    Protocol["WiFi"] = "WiFi";
    Protocol["Bluetooth"] = "Bluetooth";
    Protocol["Unknown"] = "Unknown";
})(Protocol || (exports.Protocol = Protocol = {}));
exports.DEVICE_NETWORK_LINK_MODEL = 'DeviceNetworkLink';
let DeviceNetworkLinkModel = class DeviceNetworkLinkModel {
    sourceDeviceId;
    targetDeviceId;
    protocol;
    linkQuality;
    rssi;
    lqi;
    metadata;
    collectedAt;
};
exports.DeviceNetworkLinkModel = DeviceNetworkLinkModel;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], DeviceNetworkLinkModel.prototype, "sourceDeviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], DeviceNetworkLinkModel.prototype, "targetDeviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(Protocol) }),
    __metadata("design:type", String)
], DeviceNetworkLinkModel.prototype, "protocol", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DeviceNetworkLinkModel.prototype, "linkQuality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DeviceNetworkLinkModel.prototype, "rssi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DeviceNetworkLinkModel.prototype, "lqi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], DeviceNetworkLinkModel.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], DeviceNetworkLinkModel.prototype, "collectedAt", void 0);
exports.DeviceNetworkLinkModel = DeviceNetworkLinkModel = __decorate([
    (0, mongoose_1.Schema)({ collection: 'DeviceNetworkLink' })
], DeviceNetworkLinkModel);
exports.DeviceNetworkLinkSchema = mongoose_1.SchemaFactory.createForClass(DeviceNetworkLinkModel);
exports.DeviceNetworkLinkSchema.index({ sourceDeviceId: 1, targetDeviceId: 1, protocol: 1 }, { unique: true });
exports.DeviceNetworkLinkSchema.index({ sourceDeviceId: 1, collectedAt: -1 });
//# sourceMappingURL=device-network-link.mongo.js.map