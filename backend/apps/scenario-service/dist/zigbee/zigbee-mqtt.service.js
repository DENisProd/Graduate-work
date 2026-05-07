"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ZigbeeMqttService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeMqttService = void 0;
const common_1 = require("@nestjs/common");
const mqtt = __importStar(require("mqtt"));
const zigbee_ingest_service_1 = require("./zigbee-ingest.service");
const house_mqtt_config_repository_1 = require("./house-mqtt-config.repository");
let ZigbeeMqttService = ZigbeeMqttService_1 = class ZigbeeMqttService {
    configRepo;
    ingest;
    logger = new common_1.Logger(ZigbeeMqttService_1.name);
    connections = new Map();
    constructor(configRepo, ingest) {
        this.configRepo = configRepo;
        this.ingest = ingest;
    }
    async onModuleInit() {
        const configs = await this.configRepo.findAll();
        for (const config of configs) {
            if (config.enabled) {
                this.connect(config);
            }
        }
    }
    onModuleDestroy() {
        for (const entry of this.connections.values()) {
            entry.client.removeAllListeners();
            entry.client.end(true);
        }
        this.connections.clear();
    }
    connect(config) {
        this.disconnectHouse(config.houseId);
        const topicPrefix = config.topicPrefix.replace(/\/+$/, '');
        const opts = {
            reconnectPeriod: 5000,
            connectTimeout: 10_000,
            clientId: `scenario-${config.houseId.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
        };
        if (config.mqttUsername)
            opts.username = config.mqttUsername;
        if (config.mqttPassword)
            opts.password = config.mqttPassword;
        const client = mqtt.connect(config.mqttUrl, opts);
        const entry = { client, topicPrefix, houseId: config.houseId };
        this.connections.set(config.houseId, entry);
        client.on('connect', () => {
            this.logger.log(`[${config.houseId}] MQTT подключён: ${config.mqttUrl}`);
            const pattern = `${topicPrefix}/#`;
            client.subscribe(pattern, { qos: 0 }, (err) => {
                if (err) {
                    this.logger.error(`[${config.houseId}] Подписка не удалась: ${pattern}`, err);
                    return;
                }
                this.logger.log(`[${config.houseId}] Подписка: ${pattern}`);
                this.requestBridgeDeviceList(config.houseId);
            });
        });
        client.on('message', (topic, payload) => {
            this.logIncoming(config.houseId, topic, payload);
            void this.ingest.processMqttMessage(config.houseId, topicPrefix, topic, payload);
        });
        client.on('error', (err) => {
            this.logger.error(`[${config.houseId}] MQTT ошибка`, err);
        });
        client.on('reconnect', () => {
            this.logger.warn(`[${config.houseId}] MQTT переподключение…`);
        });
    }
    disconnectHouse(houseId) {
        const existing = this.connections.get(houseId);
        if (existing) {
            existing.client.removeAllListeners();
            existing.client.end(true);
            this.connections.delete(houseId);
        }
    }
    getConnectionStatus(houseId) {
        const entry = this.connections.get(houseId);
        if (!entry)
            return { connected: false };
        return { connected: entry.client.connected };
    }
    getAllStatuses() {
        const result = {};
        for (const [houseId, entry] of this.connections.entries()) {
            result[houseId] = { connected: entry.client.connected };
        }
        return result;
    }
    requestBridgeDeviceList(houseId) {
        const entry = this.connections.get(houseId);
        if (!entry?.client.connected) {
            return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
        }
        const topic = `${entry.topicPrefix}/bridge/request/devices`;
        entry.client.publish(topic, '{}', { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
        });
        this.logger.log(`[${houseId}] Запрос списка устройств: ${topic}`);
        return { ok: true };
    }
    permitJoin(houseId, enable, time = 254) {
        const entry = this.connections.get(houseId);
        if (!entry?.client.connected) {
            return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
        }
        const topic = `${entry.topicPrefix}/bridge/request/permit_join`;
        const t = Math.max(1, Math.min(254, Math.trunc(time)));
        const body = enable ? String(t) : 'false';
        entry.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
        });
        this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
        return { ok: true };
    }
    removeDevice(houseId, idOrName, force = false) {
        const entry = this.connections.get(houseId);
        if (!entry?.client.connected) {
            return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
        }
        const topic = `${entry.topicPrefix}/bridge/request/device/remove`;
        const body = JSON.stringify({ id: idOrName, force });
        entry.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
        });
        this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
        return { ok: true };
    }
    sendDeviceCommand(houseId, topicName, payload) {
        const entry = this.connections.get(houseId);
        if (!entry?.client.connected) {
            return { ok: false, error: `MQTT не подключён для дома ${houseId}` };
        }
        const topic = `${entry.topicPrefix}/${topicName}/set`;
        const body = JSON.stringify(payload);
        entry.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`[${houseId}] Ошибка publish ${topic}`, err);
        });
        this.logger.log(`[${houseId}] MQTT → ${topic}\n${body}`);
        return { ok: true, topic };
    }
    logIncoming(houseId, topic, payload) {
        const raw = payload.toString();
        let body;
        try {
            body = JSON.stringify(JSON.parse(raw), null, 2);
        }
        catch {
            body = raw || '(пусто)';
        }
        const max = 16_000;
        if (body.length > max) {
            body = `${body.slice(0, max)}\n… (обрезано, всего ${body.length} символов)`;
        }
        this.logger.log(`[${houseId}] MQTT ← ${topic}\n${body}`);
    }
};
exports.ZigbeeMqttService = ZigbeeMqttService;
exports.ZigbeeMqttService = ZigbeeMqttService = ZigbeeMqttService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => zigbee_ingest_service_1.ZigbeeIngestService))),
    __metadata("design:paramtypes", [house_mqtt_config_repository_1.HouseMqttConfigRepository,
        zigbee_ingest_service_1.ZigbeeIngestService])
], ZigbeeMqttService);
//# sourceMappingURL=zigbee-mqtt.service.js.map