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
const device_data_service_1 = require("../device-data/device-data.service");
const zigbee_device_log_mongo_1 = require("../mongo/schemas/zigbee-device-log.mongo");
const zigbee_device_log_repository_1 = require("./zigbee-device-log.repository");
const zigbee_device_repository_1 = require("./zigbee-device.repository");
const zigbee_link_repository_1 = require("./zigbee-link.repository");
const zigbee_realtime_service_1 = require("./zigbee-realtime.service");
const zigbee_state_repository_1 = require("./zigbee-state.repository");
const normalize_zigbee_payload_1 = require("./normalize-zigbee-payload");
const zigbee_schemas_1 = require("./schemas/zigbee.schemas");
let ZigbeeService = class ZigbeeService {
    devices;
    states;
    links;
    deviceLogs;
    realtime;
    deviceData;
    constructor(devices, states, links, deviceLogs, realtime, deviceData) {
        this.devices = devices;
        this.states = states;
        this.links = links;
        this.deviceLogs = deviceLogs;
        this.realtime = realtime;
        this.deviceData = deviceData;
    }
    upsertDevice(input) {
        return this.devices.upsertByIeeeAddr(input);
    }
    async createState(input, options) {
        const normalized = (0, normalize_zigbee_payload_1.normalizeZigbeePayload)(input.payload);
        const created = await this.states.create({
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
        const logSource = options?.logSource ?? zigbee_device_log_mongo_1.ZigbeeDeviceLogSource.Api;
        const device = await this.devices.findByIeeeAddr(input.deviceIeeeAddr);
        const payloadKeys = Object.keys(input.payload).slice(0, 64);
        await this.deviceLogs.appendFromState({
            state: created,
            physicalDeviceId: device?.id ?? null,
            source: logSource,
            payloadKeys,
        });
        this.realtime.publishStateUpdate(created, {
            physicalDeviceId: device?.id ?? null,
            friendlyName: device?.friendlyName ?? null,
            payload: input.payload,
        });
        return created;
    }
    listDeviceLogs(query) {
        return this.deviceLogs.findMany(query);
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
    async applyBridgeEvent(payload) {
        const eventType = payload.type;
        if (typeof eventType !== 'string')
            return;
        const data = payload.data;
        if (!data || typeof data !== 'object' || Array.isArray(data))
            return;
        const d = data;
        const ieeeRaw = d.ieee_address ?? d.ieeeAddr;
        if (typeof ieeeRaw !== 'string' || ieeeRaw.length < 3)
            return;
        const fn = d.friendly_name ?? d.friendlyName;
        const friendlyName = typeof fn === 'string' ? fn : undefined;
        switch (eventType) {
            case 'device_announce':
            case 'device_joined':
            case 'device_interview':
            case 'interview_successful':
                await this.upsertDevice({
                    ieeeAddr: ieeeRaw,
                    friendlyName,
                });
                break;
            default:
                break;
        }
    }
    async syncDevicesFromZigbee2MqttBridge(list) {
        if (!Array.isArray(list))
            return;
        for (const item of list) {
            if (!item || typeof item !== 'object')
                continue;
            const o = item;
            const ieeeRaw = o.ieee_address ?? o.ieeeAddr;
            if (typeof ieeeRaw !== 'string' || ieeeRaw.length < 3)
                continue;
            const fn = o.friendly_name ?? o.friendlyName;
            const friendlyName = typeof fn === 'string' ? fn : undefined;
            const typeRaw = o.type;
            let type;
            if (typeof typeRaw === 'string' &&
                Object.values(zigbee_schemas_1.ZigbeeDeviceType).includes(typeRaw)) {
                type = typeRaw;
            }
            const net = o.network_address ?? o.networkAddress;
            const networkAddress = typeof net === 'number' && Number.isFinite(net)
                ? net
                : typeof net === 'string' && net.trim() !== ''
                    ? Number(net)
                    : undefined;
            const manufacturerName = typeof o.manufacturer === 'string'
                ? o.manufacturer
                : typeof o.manufacturerName === 'string'
                    ? o.manufacturerName
                    : undefined;
            const modelId = typeof o.model_id === 'string'
                ? o.model_id
                : typeof o.modelID === 'string'
                    ? o.modelID
                    : undefined;
            const definition = typeof o.definition === 'object' &&
                o.definition !== null &&
                !Array.isArray(o.definition)
                ? o.definition
                : undefined;
            let lastSeen;
            const ls = o.last_seen ?? o.lastSeen;
            if (typeof ls === 'string' && ls.trim() !== '') {
                const t = Date.parse(ls);
                if (!Number.isNaN(t))
                    lastSeen = new Date(t);
            }
            else if (typeof ls === 'number' && Number.isFinite(ls)) {
                lastSeen = new Date(ls);
            }
            const capabilities = capabilitiesFromBridgeDefinition(definition);
            await this.devices.upsertByIeeeAddr({
                ieeeAddr: ieeeRaw,
                friendlyName,
                type,
                networkAddress: networkAddress !== undefined && Number.isFinite(networkAddress)
                    ? Math.trunc(networkAddress)
                    : undefined,
                manufacturerName,
                modelId,
                definition,
                ...(lastSeen !== undefined ? { lastSeen } : {}),
                ...(capabilities ? { capabilities } : {}),
            });
        }
    }
    async ingestMqttDeviceState(topicSegment, payload) {
        let ieeeAddr;
        const byName = await this.devices.findByFriendlyName(topicSegment);
        if (byName)
            ieeeAddr = byName.ieeeAddr;
        if (!ieeeAddr) {
            const fromTopic = ieeeAddrFromZ2mTopicName(topicSegment);
            if (fromTopic)
                ieeeAddr = fromTopic;
        }
        if (!ieeeAddr) {
            const byIeee = await this.devices.findByIeeeAddr(topicSegment);
            if (byIeee)
                ieeeAddr = byIeee.ieeeAddr;
        }
        if (!ieeeAddr)
            ieeeAddr = extractIeeeFromZigbeePayload(payload);
        if (!ieeeAddr)
            return;
        ieeeAddr = (0, zigbee_device_repository_1.canonicalZigbeeIeeeAddr)(ieeeAddr);
        let device = await this.devices.findByIeeeAddr(ieeeAddr);
        if (!device) {
            await this.devices.upsertByIeeeAddr({
                ieeeAddr,
                ...(ieeeAddrFromZ2mTopicName(topicSegment) === undefined &&
                    topicSegment.trim().length > 0
                    ? { friendlyName: topicSegment.trim() }
                    : {}),
            });
            device = await this.devices.findByIeeeAddr(ieeeAddr);
        }
        await this.devices.touchLastSeen(ieeeAddr);
        const created = await this.createState({ deviceIeeeAddr: ieeeAddr, payload }, { logSource: zigbee_device_log_mongo_1.ZigbeeDeviceLogSource.Mqtt });
        const dev = device ?? (await this.devices.findByIeeeAddr(ieeeAddr));
        if (dev) {
            await this.deviceData.ingestFromZigbeePayload(dev.id, payload, created.timestamp);
        }
    }
};
exports.ZigbeeService = ZigbeeService;
exports.ZigbeeService = ZigbeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [zigbee_device_repository_1.ZigbeeDeviceRepository,
        zigbee_state_repository_1.ZigbeeStateRepository,
        zigbee_link_repository_1.ZigbeeLinkRepository,
        zigbee_device_log_repository_1.ZigbeeDeviceLogRepository,
        zigbee_realtime_service_1.ZigbeeRealtimeService,
        device_data_service_1.DeviceDataService])
], ZigbeeService);
function collectExposedProperties(node, out) {
    if (node === null || node === undefined)
        return;
    if (Array.isArray(node)) {
        for (const x of node)
            collectExposedProperties(x, out);
        return;
    }
    if (typeof node !== 'object')
        return;
    const o = node;
    const prop = o.property;
    if (typeof prop === 'string' && prop.length > 0) {
        out.add(prop);
    }
    else if (typeof o.name === 'string' &&
        o.name.length > 0 &&
        typeof o.type === 'string' &&
        o.type !== 'composite' &&
        o.type !== 'light') {
        out.add(o.name);
    }
    for (const k of ['features', 'items', 'endpoints', 'values']) {
        if (k in o && o[k] !== undefined) {
            collectExposedProperties(o[k], out);
        }
    }
}
function capabilitiesFromBridgeDefinition(definition) {
    if (!definition || !Array.isArray(definition.exposes))
        return undefined;
    const s = new Set();
    collectExposedProperties(definition.exposes, s);
    const arr = [...s].sort();
    return arr.length > 0 ? arr : undefined;
}
function ieeeAddrFromZ2mTopicName(segment) {
    const t = segment.trim();
    if (!/^0x[0-9a-fA-F]{16}$/i.test(t))
        return undefined;
    return (0, zigbee_device_repository_1.canonicalZigbeeIeeeAddr)(t);
}
function extractIeeeFromZigbeePayload(p) {
    const top = p.ieee_address ?? p.ieeeAddress ?? p.ieee;
    if (typeof top === 'string' && top.length >= 3)
        return top;
    const dev = p.device;
    if (dev && typeof dev === 'object' && !Array.isArray(dev)) {
        const d = dev;
        const nested = d.ieeeAddress ?? d.ieee_address ?? d.ieee;
        if (typeof nested === 'string' && nested.length >= 3)
            return nested;
    }
    return undefined;
}
//# sourceMappingURL=zigbee.service.js.map