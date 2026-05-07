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
var ZigbeeIngestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeIngestService = void 0;
const common_1 = require("@nestjs/common");
const zigbee_service_1 = require("./zigbee.service");
function parseJson(payload) {
    const s = payload.toString().trim();
    if (!s)
        return undefined;
    try {
        return JSON.parse(s);
    }
    catch {
        return undefined;
    }
}
function parseJsonObject(buf) {
    const v = parseJson(buf);
    if (v === null || v === undefined)
        return null;
    if (typeof v === 'object' && !Array.isArray(v)) {
        return v;
    }
    return { value: v };
}
let ZigbeeIngestService = ZigbeeIngestService_1 = class ZigbeeIngestService {
    zigbee;
    logger = new common_1.Logger(ZigbeeIngestService_1.name);
    constructor(zigbee) {
        this.zigbee = zigbee;
    }
    async processMqttMessage(topicBase, topic, payload) {
        const prefix = `${topicBase}/`;
        if (topic !== topicBase && !topic.startsWith(prefix))
            return;
        const relative = topic === topicBase ? '' : topic.slice(prefix.length);
        if (relative === '')
            return;
        try {
            if (relative === 'bridge/devices') {
                await this.onBridgeDevices(payload);
                return;
            }
            if (relative === 'bridge/event') {
                await this.onBridgeEvent(payload);
                return;
            }
            if (relative === 'bridge/state') {
                this.onBridgeState(payload);
                return;
            }
            if (relative === 'bridge/info') {
                this.onBridgeInfo(payload);
                return;
            }
            if (relative === 'bridge/health') {
                this.onBridgeHealth(payload);
                return;
            }
            if (relative === 'bridge/logging') {
                return;
            }
            if (relative === 'bridge/extensions') {
                return;
            }
            if (relative.startsWith('bridge/response')) {
                this.onBridgeResponse(relative, payload);
                return;
            }
            if (relative.startsWith('bridge/')) {
                this.logger.debug(`bridge (без отдельного обработчика): ${relative}`);
                return;
            }
            if (relative.includes('/'))
                return;
            await this.onDeviceTelemetry(relative, payload);
        }
        catch (e) {
            this.logger.error(`Ошибка обработки Zigbee MQTT ${topic}: ${e instanceof Error ? e.message : String(e)}`, e instanceof Error ? e.stack : undefined);
        }
    }
    async onBridgeDevices(payload) {
        const raw = parseJson(payload);
        if (raw === undefined && payload.toString().trim() !== '') {
            this.logger.warn('bridge/devices: невалидный JSON');
            return;
        }
        await this.zigbee.syncDevicesFromZigbee2MqttBridge(raw);
        this.logger.debug(`bridge/devices: синхронизация (${Array.isArray(raw) ? raw.length : 0} устройств)`);
    }
    async onBridgeEvent(payload) {
        const obj = parseJsonObject(payload);
        if (!obj) {
            this.logger.warn('bridge/event: пустой или невалидный JSON');
            return;
        }
        await this.zigbee.applyBridgeEvent(obj);
    }
    onBridgeState(payload) {
        const obj = parseJsonObject(payload);
        if (!obj)
            return;
        const permitJoin = Boolean(obj.permit_join);
        const timeout = typeof obj.permit_join_timeout === 'number'
            ? obj.permit_join_timeout
            : null;
        this.zigbee.emitPairingStatus({ permitJoin, timeout });
        this.logger.debug(`bridge/state: permit_join=${String(permitJoin)}, timeout=${String(timeout)}`);
    }
    onBridgeInfo(payload) {
        const raw = parseJson(payload);
        const n = typeof raw === 'object' &&
            raw !== null &&
            !Array.isArray(raw) &&
            'commit' in raw
            ? String(raw.commit ?? '')
            : '';
        this.logger.debug(`bridge/info: получено (${Buffer.byteLength(payload)} байт)${n ? ` commit=${n}` : ''}`);
    }
    onBridgeHealth(payload) {
        const obj = parseJsonObject(payload);
        if (!obj)
            return;
        const mqtt = obj.mqtt;
        const mq = mqtt && typeof mqtt === 'object' && !Array.isArray(mqtt)
            ? mqtt
            : null;
        this.logger.debug(`bridge/health: mqtt.connected=${String(mq?.connected ?? '')}`);
    }
    onBridgeResponse(relative, payload) {
        const obj = parseJsonObject(payload);
        this.logger.debug(`bridge/response ${relative}: ${obj ? JSON.stringify(obj).slice(0, 200) : '(не JSON)'}`);
    }
    async onDeviceTelemetry(friendlyName, payload) {
        const data = parseJsonObject(payload);
        if (!data)
            return;
        await this.zigbee.ingestMqttDeviceState(friendlyName, data);
    }
};
exports.ZigbeeIngestService = ZigbeeIngestService;
exports.ZigbeeIngestService = ZigbeeIngestService = ZigbeeIngestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => zigbee_service_1.ZigbeeService))),
    __metadata("design:paramtypes", [zigbee_service_1.ZigbeeService])
], ZigbeeIngestService);
//# sourceMappingURL=zigbee-ingest.service.js.map