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
var ZigbeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const device_data_service_1 = require("../device-data/device-data.service");
const device_catalog_service_1 = require("../device-catalog/device-catalog.service");
const zigbee_device_log_mongo_1 = require("../mongo/schemas/zigbee-device-log.mongo");
const zigbee_device_log_repository_1 = require("./zigbee-device-log.repository");
const zigbee_device_repository_1 = require("./zigbee-device.repository");
const zigbee_link_repository_1 = require("./zigbee-link.repository");
const zigbee_mqtt_service_1 = require("./zigbee-mqtt.service");
const zigbee_realtime_service_1 = require("./zigbee-realtime.service");
const zigbee_state_repository_1 = require("./zigbee-state.repository");
const normalize_zigbee_payload_1 = require("./normalize-zigbee-payload");
const zigbee_schemas_1 = require("./schemas/zigbee.schemas");
const DELETED_DEVICE_TTL_MS = 120_000;
let ZigbeeService = ZigbeeService_1 = class ZigbeeService {
    devices;
    states;
    links;
    deviceLogs;
    realtime;
    deviceData;
    catalogService;
    mqtt;
    logger = new common_1.Logger(ZigbeeService_1.name);
    pairingEvents$ = new rxjs_1.Subject();
    pairingStatus$ = new rxjs_1.Subject();
    deviceState$ = new rxjs_1.Subject();
    recentlyDeleted = new Map();
    constructor(devices, states, links, deviceLogs, realtime, deviceData, catalogService, mqtt) {
        this.devices = devices;
        this.states = states;
        this.links = links;
        this.deviceLogs = deviceLogs;
        this.realtime = realtime;
        this.deviceData = deviceData;
        this.catalogService = catalogService;
        this.mqtt = mqtt;
    }
    markDeleted(canonical) {
        this.recentlyDeleted.set(canonical, Date.now() + DELETED_DEVICE_TTL_MS);
    }
    isRecentlyDeleted(canonical) {
        const expiry = this.recentlyDeleted.get(canonical);
        if (expiry === undefined)
            return false;
        if (Date.now() > expiry) {
            this.recentlyDeleted.delete(canonical);
            return false;
        }
        return true;
    }
    async upsertDevice(input) {
        const device = await this.devices.upsertByIeeeAddr(input);
        await this.enrichDeviceCatalogLinks(device, input);
        return this.devices
            .findByIeeeAddr(device.ieeeAddr)
            .then((v) => v ?? device);
    }
    async enrichDeviceCatalogLinks(device, input) {
        try {
            const synced = await this.catalogService.syncWithCatalog({
                manufacturerName: input.manufacturerName ?? device.manufacturerName,
                model: input.modelId ?? device.modelId,
                definition: input.definition ?? device.definition,
                friendlyName: input.friendlyName ?? device.friendlyName,
                ieeeAddr: input.ieeeAddr ?? device.ieeeAddr,
            });
            if (!synced.deviceId || !synced.deviceCategoryId)
                return;
            if (device.deviceId === synced.deviceId &&
                device.deviceCategoryId === synced.deviceCategoryId) {
                return;
            }
            await this.devices.upsertByIeeeAddr({
                ieeeAddr: device.ieeeAddr,
                deviceId: synced.deviceId,
                deviceCategoryId: synced.deviceCategoryId,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`catalog-link-enrich failed for ${device.ieeeAddr}: ${message}`);
        }
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
    permitJoin(houseId, enable, time = 254) {
        return this.mqtt.permitJoin(houseId, enable, time);
    }
    emitPairingStatus(status) {
        this.pairingStatus$.next(status);
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
        if (this.isRecentlyDeleted((0, zigbee_device_repository_1.canonicalZigbeeIeeeAddr)(ieeeRaw)))
            return;
        switch (eventType) {
            case 'device_announce': {
                await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
                const annDev = await this.devices.findByIeeeAddr(ieeeRaw);
                if (annDev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                    break;
                const fullyKnown = Boolean(annDev?.modelId) || (annDev?.capabilities?.length ?? 0) > 0;
                this.pairingEvents$.next({
                    type: fullyKnown ? 'interview_done' : 'joined',
                    ieeeAddr: ieeeRaw,
                    friendlyName: friendlyName ?? ieeeRaw,
                    physicalDeviceId: annDev?.id ?? null,
                    model: annDev?.modelId ?? null,
                    manufacturer: annDev?.manufacturerName ?? null,
                    capabilities: annDev?.capabilities ?? [],
                    supported: fullyKnown,
                });
                break;
            }
            case 'device_joined': {
                await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
                const dev = await this.devices.findByIeeeAddr(ieeeRaw);
                if (dev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                    break;
                this.pairingEvents$.next({
                    type: 'joined',
                    ieeeAddr: ieeeRaw,
                    friendlyName: friendlyName ?? ieeeRaw,
                    physicalDeviceId: dev?.id ?? null,
                });
                break;
            }
            case 'device_interview': {
                const status = d.status;
                await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
                if (status === 'started') {
                    const dev = await this.devices.findByIeeeAddr(ieeeRaw);
                    if (dev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                        break;
                    this.pairingEvents$.next({
                        type: 'interview_started',
                        ieeeAddr: ieeeRaw,
                        friendlyName: friendlyName ?? ieeeRaw,
                        physicalDeviceId: dev?.id ?? null,
                    });
                }
                else if (status === 'successful') {
                    const defRaw = d.definition;
                    const definition = defRaw && typeof defRaw === 'object' && !Array.isArray(defRaw)
                        ? defRaw
                        : null;
                    const capabilities = definition
                        ? capabilitiesFromBridgeDefinition(definition)
                        : undefined;
                    const manufacturerRaw = d.manufacturer ?? definition?.vendor;
                    const manufacturer = typeof manufacturerRaw === 'string' ? manufacturerRaw : null;
                    const modelRaw = d.model_id ?? d.modelID ?? definition?.model;
                    const model = typeof modelRaw === 'string' ? modelRaw : null;
                    await this.upsertDevice({
                        ieeeAddr: ieeeRaw,
                        friendlyName,
                        ...(definition ? { definition } : {}),
                        ...(capabilities ? { capabilities } : {}),
                        ...(manufacturer ? { manufacturerName: manufacturer } : {}),
                        ...(model ? { modelId: model } : {}),
                    });
                    const dev = await this.devices.findByIeeeAddr(ieeeRaw);
                    if (dev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                        break;
                    this.pairingEvents$.next({
                        type: 'interview_done',
                        ieeeAddr: ieeeRaw,
                        friendlyName: friendlyName ?? ieeeRaw,
                        supported: Boolean(d.supported),
                        definition,
                        capabilities: capabilities ?? [],
                        physicalDeviceId: dev?.id ?? null,
                        model: dev?.modelId ?? model,
                        manufacturer: dev?.manufacturerName ?? manufacturer,
                    });
                }
                else if (status === 'failed') {
                    const dev = await this.devices.findByIeeeAddr(ieeeRaw);
                    if (dev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                        break;
                    this.pairingEvents$.next({
                        type: 'interview_failed',
                        ieeeAddr: ieeeRaw,
                        friendlyName: friendlyName ?? ieeeRaw,
                        physicalDeviceId: dev?.id ?? null,
                    });
                }
                break;
            }
            case 'interview_successful': {
                await this.upsertDevice({ ieeeAddr: ieeeRaw, friendlyName });
                const dev = await this.devices.findByIeeeAddr(ieeeRaw);
                if (dev?.type === zigbee_schemas_1.ZigbeeDeviceType.Coordinator)
                    break;
                this.pairingEvents$.next({
                    type: 'interview_done',
                    ieeeAddr: ieeeRaw,
                    friendlyName: friendlyName ?? ieeeRaw,
                    supported: true,
                    physicalDeviceId: dev?.id ?? null,
                });
                break;
            }
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
            await this.upsertDevice({
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
    async removeDevice(ieeeAddr, force = true) {
        const canonical = (0, zigbee_device_repository_1.canonicalZigbeeIeeeAddr)(ieeeAddr);
        const device = await this.devices.findByIeeeAddr(canonical);
        if (!device) {
            return { ok: false, error: `Устройство ${ieeeAddr} не найдено` };
        }
        this.markDeleted(canonical);
        if (device.houseId) {
            this.mqtt.removeDevice(device.houseId, device.friendlyName ?? canonical, force);
        }
        await Promise.all([
            this.devices.deleteByIeeeAddr(canonical),
            this.states.deleteManyByIeeeAddr(canonical),
            this.deviceLogs.deleteManyByIeeeAddr(canonical),
        ]);
        return { ok: true, device };
    }
    async sendCommand(ieeeAddr, payload) {
        const device = await this.devices.findByIeeeAddr(ieeeAddr);
        if (!device) {
            return { ok: false, error: `Устройство ${ieeeAddr} не найдено` };
        }
        if (!device.houseId) {
            return { ok: false, error: 'Устройство не привязано к дому (houseId отсутствует)' };
        }
        const topicName = device.friendlyName ?? device.ieeeAddr;
        return this.mqtt.sendDeviceCommand(device.houseId, topicName, payload);
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
        if (this.isRecentlyDeleted(ieeeAddr))
            return;
        let device = await this.devices.findByIeeeAddr(ieeeAddr);
        if (!device) {
            await this.upsertDevice({
                ieeeAddr,
                ...(ieeeAddrFromZ2mTopicName(topicSegment) === undefined &&
                    topicSegment.trim().length > 0
                    ? { friendlyName: topicSegment.trim() }
                    : {}),
            });
            device = await this.devices.findByIeeeAddr(ieeeAddr);
            if (device && device.type !== zigbee_schemas_1.ZigbeeDeviceType.Coordinator) {
                this.pairingEvents$.next({
                    type: 'joined',
                    ieeeAddr: device.ieeeAddr,
                    friendlyName: device.friendlyName ?? device.ieeeAddr,
                    physicalDeviceId: device.id,
                    model: device.modelId ?? null,
                    manufacturer: device.manufacturerName ?? null,
                    capabilities: device.capabilities ?? [],
                    supported: Boolean(device.modelId) || (device.capabilities?.length ?? 0) > 0,
                });
            }
        }
        await this.devices.touchLastSeen(ieeeAddr);
        const created = await this.createState({ deviceIeeeAddr: ieeeAddr, payload }, { logSource: zigbee_device_log_mongo_1.ZigbeeDeviceLogSource.Mqtt });
        const dev = device ?? (await this.devices.findByIeeeAddr(ieeeAddr));
        if (dev) {
            await this.deviceData.ingestFromZigbeePayload(dev.id, payload, created.timestamp);
        }
        this.deviceState$.next({
            houseId: dev?.houseId ?? null,
            friendlyName: topicSegment,
            ieeeAddr,
            payload,
            timestamp: created.timestamp,
        });
    }
    sendCommand(houseId, friendlyName, args) {
        return this.mqtt.sendDeviceCommand(houseId, friendlyName, args);
    }
    async getLatestStateByFriendlyName(friendlyName) {
        const device = await this.devices.findByFriendlyName(friendlyName);
        if (!device)
            return null;
        const stateMap = await this.states.findLatestByDeviceIeeeAddrs([
            device.ieeeAddr,
        ]);
        return (stateMap.get(device.ieeeAddr)?.payload ??
            null);
    }
};
exports.ZigbeeService = ZigbeeService;
exports.ZigbeeService = ZigbeeService = ZigbeeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => zigbee_mqtt_service_1.ZigbeeMqttService))),
    __metadata("design:paramtypes", [zigbee_device_repository_1.ZigbeeDeviceRepository,
        zigbee_state_repository_1.ZigbeeStateRepository,
        zigbee_link_repository_1.ZigbeeLinkRepository,
        zigbee_device_log_repository_1.ZigbeeDeviceLogRepository,
        zigbee_realtime_service_1.ZigbeeRealtimeService,
        device_data_service_1.DeviceDataService,
        device_catalog_service_1.DeviceCatalogService,
        zigbee_mqtt_service_1.ZigbeeMqttService])
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