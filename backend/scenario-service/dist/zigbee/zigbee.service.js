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
exports.ZigbeeService = void 0;
const common_1 = require("@nestjs/common");
const zigbee_device_repository_1 = require("./zigbee-device.repository");
const zigbee_link_repository_1 = require("./zigbee-link.repository");
const zigbee_state_repository_1 = require("./zigbee-state.repository");
const normalize_zigbee_payload_1 = require("./normalize-zigbee-payload");
let ZigbeeService = class ZigbeeService {
    devices;
    states;
    links;
    constructor(devices, states, links) {
        this.devices = devices;
        this.states = states;
        this.links = links;
    }
    upsertDevice(input) {
        return this.devices.upsertByIeeeAddr(input);
    }
    createState(input) {
        const normalized = (0, normalize_zigbee_payload_1.normalizeZigbeePayload)(input.payload);
        return this.states.create({
            ...input,
            state: input.state ?? normalized.state,
            brightness: input.brightness ?? normalized.brightness,
            linkquality: input.linkquality ?? normalized.linkquality,
            colorMode: input.colorMode ?? normalized.colorMode,
            occupancy: input.occupancy ?? normalized.occupancy,
            temperature: input.temperature ?? normalized.temperature,
            humidity: input.humidity ?? normalized.humidity,
            battery: input.battery ?? normalized.battery,
        });
    }
    createLinksBatch(input) {
        return this.links.createMany({
            collectedAt: input.collectedAt,
            links: input.links,
        });
    }
    listDevices(query) {
        return this.devices.findMany(query);
    }
    getDeviceByIeeeAddr(ieeeAddr) {
        return this.devices.findByIeeeAddr(ieeeAddr);
    }
    listStates(query) {
        return this.states.findMany(query);
    }
    listLinks(query) {
        return this.links.findMany(query);
    }
};
exports.ZigbeeService = ZigbeeService;
exports.ZigbeeService = ZigbeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zigbee_device_repository_1.ZigbeeDeviceRepository,
        zigbee_state_repository_1.ZigbeeStateRepository,
        zigbee_link_repository_1.ZigbeeLinkRepository])
], ZigbeeService);
//# sourceMappingURL=zigbee.service.js.map