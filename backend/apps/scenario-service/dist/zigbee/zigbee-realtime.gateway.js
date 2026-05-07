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
var ZigbeeRealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeRealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const zigbee_schemas_1 = require("./schemas/zigbee.schemas");
const zigbee_realtime_service_1 = require("./zigbee-realtime.service");
const zigbee_service_1 = require("./zigbee.service");
const zigbee_state_repository_1 = require("./zigbee-state.repository");
const zigbee_device_repository_1 = require("./zigbee-device.repository");
const PAIRING_ROOM = 'pairing';
function roomForIeee(ieee) {
    return `zigbee:${ieee}`;
}
function corsOriginsFromEnv() {
    const raw = process.env.SCENARIO_CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '';
    const parts = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.length > 0 ? parts : ['http://localhost:3000'];
}
function trackedIeees(client) {
    const d = client.data;
    if (!d.zigbeeIeees)
        d.zigbeeIeees = new Set();
    return d.zigbeeIeees;
}
let ZigbeeRealtimeGateway = ZigbeeRealtimeGateway_1 = class ZigbeeRealtimeGateway {
    realtime;
    states;
    devices;
    zigbee;
    logger = new common_1.Logger(ZigbeeRealtimeGateway_1.name);
    sub;
    pairingSub;
    pairingStatusSub;
    server;
    constructor(realtime, states, devices, zigbee) {
        this.realtime = realtime;
        this.states = states;
        this.devices = devices;
        this.zigbee = zigbee;
    }
    onModuleInit() {
        this.sub = this.realtime.stateUpdates$.subscribe((p) => {
            this.emitState(p);
        });
        this.pairingSub = this.zigbee.pairingEvents$.subscribe((event) => {
            this.server?.to(PAIRING_ROOM).emit('zigbee:pairing:event', event);
        });
        this.pairingStatusSub = this.zigbee.pairingStatus$.subscribe((status) => {
            this.server?.to(PAIRING_ROOM).emit('zigbee:pairing:status', status);
        });
    }
    afterInit() {
        this.logger.log('Socket.IO namespace /zigbee готов');
    }
    onModuleDestroy() {
        this.sub?.unsubscribe();
        this.pairingSub?.unsubscribe();
        this.pairingStatusSub?.unsubscribe();
    }
    emitState(p) {
        if (!this.server)
            return;
        const room = roomForIeee(p.deviceIeeeAddr);
        this.server.to(room).emit('zigbee:state', this.toWire(p));
    }
    toWire(p) {
        return {
            deviceIeeeAddr: p.deviceIeeeAddr,
            physicalDeviceId: p.physicalDeviceId ?? null,
            friendlyName: p.friendlyName ?? null,
            timestamp: p.timestamp instanceof Date
                ? p.timestamp.toISOString()
                : String(p.timestamp),
            metrics: p.metrics,
            payload: p.payload,
            stateId: p.stateId,
        };
    }
    async emitExistingDevicesToClient(client) {
        try {
            const { items } = await this.zigbee.listDevices({ page: 1, limit: 100 });
            for (const dev of items) {
                if (dev.type === 'Coordinator')
                    continue;
                const fullyKnown = Boolean(dev.modelId) || (dev.capabilities?.length ?? 0) > 0;
                client.emit('zigbee:pairing:event', {
                    type: fullyKnown ? 'interview_done' : 'joined',
                    ieeeAddr: dev.ieeeAddr,
                    friendlyName: dev.friendlyName ?? dev.ieeeAddr,
                    physicalDeviceId: dev.physicalDeviceId,
                    model: dev.modelId ?? null,
                    manufacturer: dev.manufacturerName ?? null,
                    capabilities: dev.capabilities ?? [],
                    supported: fullyKnown,
                });
            }
        }
        catch (e) {
            this.logger.warn(`emitExistingDevicesToClient failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    async resolveIeeeList(body) {
        const parsed = zigbee_schemas_1.zigbeeSocketSubscribeSchema.safeParse(body);
        if (!parsed.success) {
            return {
                ieees: [],
                error: parsed.error.flatten().formErrors.join('; ') || 'Невалидное тело',
            };
        }
        const { deviceIeeeAddrs = [], physicalDeviceIds = [] } = parsed.data;
        const map = await this.devices.findIeeeAddrsByPhysicalIds(physicalDeviceIds);
        const fromIds = physicalDeviceIds
            .map((id) => map.get(id))
            .filter((x) => typeof x === 'string' && x.length >= 3);
        const merged = [
            ...deviceIeeeAddrs.map((s) => s.trim()),
            ...fromIds.map((s) => s.trim()),
        ].filter((s) => s.length >= 3);
        const unique = [...new Set(merged)];
        return { ieees: unique };
    }
    async onSubscribe(client, body) {
        const { ieees, error } = await this.resolveIeeeList(body);
        if (error)
            return { ok: false, error };
        if (ieees.length === 0) {
            return {
                ok: false,
                error: 'Нет валидных устройств для подписки',
            };
        }
        const track = trackedIeees(client);
        for (const ieee of ieees) {
            track.add(ieee);
            await client.join(roomForIeee(ieee));
        }
        const latest = await this.states.findLatestByDeviceIeeeAddrs(ieees);
        const snapshotRows = await Promise.all(ieees.map(async (ieee) => {
            const st = latest.get(ieee);
            if (!st)
                return null;
            const dev = await this.devices.findByIeeeAddr(ieee);
            return this.toWire({
                deviceIeeeAddr: st.deviceIeeeAddr,
                physicalDeviceId: dev?.id ?? null,
                friendlyName: dev?.friendlyName ?? null,
                timestamp: st.timestamp,
                metrics: {
                    state: st.state ?? null,
                    brightness: st.brightness ?? null,
                    linkquality: st.linkquality ?? null,
                    colorMode: st.colorMode ?? null,
                    occupancy: st.occupancy ?? null,
                    temperature: st.temperature ?? null,
                    humidity: st.humidity ?? null,
                    battery: st.battery ?? null,
                },
                payload: st.payload,
                stateId: st.id,
            });
        }));
        const snapshots = snapshotRows.filter((x) => x !== null);
        return { ok: true, subscribed: ieees.length, snapshots };
    }
    async onCommand(_client, body) {
        const parsed = zigbee_schemas_1.zigbeeSocketCommandSchema.safeParse(body);
        if (!parsed.success) {
            return {
                ok: false,
                error: parsed.error.flatten().formErrors.join('; ') || 'Невалидное тело',
            };
        }
        const { deviceIeeeAddr, physicalDeviceId, payload } = parsed.data;
        let ieeeAddr = deviceIeeeAddr;
        if (!ieeeAddr && physicalDeviceId) {
            const map = await this.devices.findIeeeAddrsByPhysicalIds([
                physicalDeviceId,
            ]);
            ieeeAddr = map.get(physicalDeviceId);
        }
        if (!ieeeAddr) {
            return { ok: false, error: 'Устройство не найдено' };
        }
        const result = await this.zigbee.sendCommand(ieeeAddr, payload);
        return result;
    }
    async onPairingWatch(client) {
        await client.join(PAIRING_ROOM);
        void this.emitExistingDevicesToClient(client);
        return { ok: true };
    }
    async onPairingUnwatch(client) {
        await client.leave(PAIRING_ROOM);
        return { ok: true };
    }
    async onPairingStart(client, body) {
        const time = body !== null &&
            typeof body === 'object' &&
            typeof body.time === 'number'
            ? Math.max(1, Math.min(254, Math.trunc(body.time)))
            : 254;
        await client.join(PAIRING_ROOM);
        const result = this.zigbee.permitJoin(true, time);
        if (!result.ok)
            return { ok: false, error: result.error };
        return { ok: true, time };
    }
    async onPairingStop(client) {
        const result = this.zigbee.permitJoin(false);
        if (!result.ok)
            return { ok: false, error: result.error };
        return { ok: true };
    }
    async onUnsubscribe(client, body) {
        const track = trackedIeees(client);
        const empty = body === null ||
            body === undefined ||
            (typeof body === 'object' &&
                body !== null &&
                Object.keys(body).length === 0);
        if (empty) {
            for (const ieee of [...track]) {
                await client.leave(roomForIeee(ieee));
            }
            track.clear();
            return { ok: true, left: 'all' };
        }
        const { ieees, error } = await this.resolveIeeeList(body);
        if (error)
            return { ok: false, error };
        for (const ieee of ieees) {
            if (track.has(ieee)) {
                track.delete(ieee);
                await client.leave(roomForIeee(ieee));
            }
        }
        return { ok: true, left: ieees.length };
    }
};
exports.ZigbeeRealtimeGateway = ZigbeeRealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], ZigbeeRealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:subscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:command'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onCommand", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:pairing:watch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onPairingWatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:pairing:unwatch'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onPairingUnwatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:pairing:start'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onPairingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:pairing:stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onPairingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('zigbee:unsubscribe'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeRealtimeGateway.prototype, "onUnsubscribe", null);
exports.ZigbeeRealtimeGateway = ZigbeeRealtimeGateway = ZigbeeRealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/zigbee',
        cors: {
            origin: corsOriginsFromEnv(),
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [zigbee_realtime_service_1.ZigbeeRealtimeService,
        zigbee_state_repository_1.ZigbeeStateRepository,
        zigbee_device_repository_1.ZigbeeDeviceRepository,
        zigbee_service_1.ZigbeeService])
], ZigbeeRealtimeGateway);
//# sourceMappingURL=zigbee-realtime.gateway.js.map