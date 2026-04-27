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
const config_1 = require("@nestjs/config");
const mqtt = __importStar(require("mqtt"));
const zigbee_ingest_service_1 = require("./zigbee-ingest.service");
let ZigbeeMqttService = ZigbeeMqttService_1 = class ZigbeeMqttService {
    config;
    ingest;
    logger = new common_1.Logger(ZigbeeMqttService_1.name);
    client = null;
    topicPrefix = null;
    constructor(config, ingest) {
        this.config = config;
        this.ingest = ingest;
    }
    onModuleInit() {
        const url = this.config.get('ZIGBEE_MQTT_URL')?.trim() ??
            process.env.ZIGBEE_MQTT_URL?.trim();
        if (!url) {
            this.logger.log('ZIGBEE_MQTT_URL не задан — MQTT (zigbee2mqtt) отключён');
            return;
        }
        const topicBase = (this.config.get('ZIGBEE_MQTT_TOPIC_PREFIX')?.trim() ??
            process.env.ZIGBEE_MQTT_TOPIC_PREFIX?.trim() ??
            'zigbee2mqtt').replace(/\/+$/, '');
        this.topicPrefix = topicBase;
        const username = this.config.get('ZIGBEE_MQTT_USERNAME') ??
            process.env.ZIGBEE_MQTT_USERNAME;
        const password = this.config.get('ZIGBEE_MQTT_PASSWORD') ??
            process.env.ZIGBEE_MQTT_PASSWORD;
        const opts = {
            reconnectPeriod: 5000,
            connectTimeout: 10_000,
            clientId: `scenario-service-${process.pid}-${Math.random().toString(36).slice(2, 10)}`,
        };
        if (username !== undefined && username !== '')
            opts.username = username;
        if (password !== undefined && password !== '')
            opts.password = password;
        this.client = mqtt.connect(url, opts);
        this.client.on('connect', () => {
            this.logger.log(`MQTT подключён: ${url}`);
            const pattern = `${topicBase}/#`;
            this.client?.subscribe(pattern, { qos: 0 }, (err) => {
                if (err) {
                    this.logger.error(`Подписка MQTT не удалась: ${pattern}`, err);
                    return;
                }
                this.logger.log(`Подписка: ${pattern}`);
                this.maybeRequestBridgeDevicesAfterSubscribe();
            });
        });
        this.client.on('message', (topic, payload) => {
            this.logIncomingMqtt(topic, payload);
            void this.ingest.processMqttMessage(topicBase, topic, payload);
        });
        this.client.on('error', (err) => {
            this.logger.error('MQTT ошибка', err);
        });
        this.client.on('reconnect', () => {
            this.logger.warn('MQTT переподключение…');
        });
    }
    onModuleDestroy() {
        if (this.client) {
            this.client.removeAllListeners();
            this.client.end(true);
            this.client = null;
        }
        this.topicPrefix = null;
    }
    requestBridgeDeviceList() {
        if (!this.client?.connected || !this.topicPrefix) {
            return { ok: false, error: 'MQTT не подключён' };
        }
        const topic = `${this.topicPrefix}/bridge/request/devices`;
        this.client.publish(topic, '{}', { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`Ошибка publish ${topic}`, err);
        });
        this.logger.log(`Запрос списка устройств у моста: ${topic}`);
        return { ok: true };
    }
    permitJoin(enable, time = 254) {
        if (!this.client?.connected || !this.topicPrefix) {
            return { ok: false, error: 'MQTT не подключён' };
        }
        const topic = `${this.topicPrefix}/bridge/request/permit_join`;
        const t = Math.max(1, Math.min(254, Math.trunc(time)));
        const body = enable ? String(t) : 'false';
        this.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`Ошибка publish ${topic}`, err);
        });
        this.logger.log(`MQTT → ${topic}\n${body}`);
        return { ok: true };
    }
    removeDevice(idOrName, force = false) {
        if (!this.client?.connected || !this.topicPrefix) {
            return { ok: false, error: 'MQTT не подключён' };
        }
        const topic = `${this.topicPrefix}/bridge/request/device/remove`;
        const body = JSON.stringify({ id: idOrName, force });
        this.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`Ошибка publish ${topic}`, err);
        });
        this.logger.log(`MQTT → ${topic}\n${body}`);
        return { ok: true };
    }
    sendDeviceCommand(topicName, payload) {
        if (!this.client?.connected || !this.topicPrefix) {
            return { ok: false, error: 'MQTT не подключён' };
        }
        const topic = `${this.topicPrefix}/${topicName}/set`;
        const body = JSON.stringify(payload);
        this.client.publish(topic, body, { qos: 0 }, (err) => {
            if (err)
                this.logger.error(`Ошибка publish ${topic}`, err);
        });
        this.logger.log(`MQTT → ${topic}\n${body}`);
        return { ok: true, topic };
    }
    maybeRequestBridgeDevicesAfterSubscribe() {
        const v = this.config.get('ZIGBEE_MQTT_REQUEST_DEVICES_ON_CONNECT') ??
            process.env.ZIGBEE_MQTT_REQUEST_DEVICES_ON_CONNECT;
        if (v === '0' || v === 'false' || v === 'off')
            return;
        this.requestBridgeDeviceList();
    }
    logIncomingMqtt(topic, payload) {
        const raw = payload.toString();
        let body;
        try {
            const parsed = JSON.parse(raw);
            body = JSON.stringify(parsed, null, 2);
        }
        catch {
            body = raw || '(пусто)';
        }
        const max = Number(this.config.get('ZIGBEE_MQTT_LOG_MAX_CHARS') ??
            process.env.ZIGBEE_MQTT_LOG_MAX_CHARS) || 16_000;
        if (body.length > max) {
            body = `${body.slice(0, max)}\n… (обрезано, всего ${body.length} символов)`;
        }
        this.logger.log(`MQTT ← ${topic}\n${body}`);
    }
};
exports.ZigbeeMqttService = ZigbeeMqttService;
exports.ZigbeeMqttService = ZigbeeMqttService = ZigbeeMqttService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => zigbee_ingest_service_1.ZigbeeIngestService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        zigbee_ingest_service_1.ZigbeeIngestService])
], ZigbeeMqttService);
//# sourceMappingURL=zigbee-mqtt.service.js.map