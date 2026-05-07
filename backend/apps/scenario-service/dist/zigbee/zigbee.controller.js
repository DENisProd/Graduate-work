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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZigbeeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const zigbee_service_1 = require("./zigbee.service");
const zigbee_mqtt_service_1 = require("./zigbee-mqtt.service");
const house_mqtt_config_repository_1 = require("./house-mqtt-config.repository");
const zigbee_schemas_1 = require("./schemas/zigbee.schemas");
let ZigbeeController = class ZigbeeController {
    service;
    zigbeeMqtt;
    mqttConfigRepo;
    constructor(service, zigbeeMqtt, mqttConfigRepo) {
        this.service = service;
        this.zigbeeMqtt = zigbeeMqtt;
        this.mqttConfigRepo = mqttConfigRepo;
    }
    listDevices(query) {
        const q = zigbee_schemas_1.listZigbeeDevicesQuerySchema.parse(query);
        return this.service.listDevices(q);
    }
    async getDevice(ieeeAddr) {
        const device = await this.service.getDeviceByIeeeAddr(ieeeAddr);
        if (!device)
            throw new common_1.NotFoundException(`ZigbeeDevice ${ieeeAddr} not found`);
        return device;
    }
    async removeDevice(ieeeAddr, force) {
        const result = await this.service.removeDevice(ieeeAddr, force === 'true');
        if (!result.ok) {
            throw new common_1.NotFoundException(result.error);
        }
        return { ok: true, deleted: result.device };
    }
    async sendCommand(ieeeAddr, body) {
        const { payload } = zigbee_schemas_1.zigbeeCommandSchema.parse(body);
        const result = await this.service.sendCommand(ieeeAddr, payload);
        if (!result.ok) {
            if (result.error.includes('не найдено')) {
                throw new common_1.NotFoundException(result.error);
            }
            throw new common_1.ServiceUnavailableException(result.error);
        }
        return { ok: true, topic: result.topic };
    }
    requestDevicesSyncFromBridge(houseId) {
        if (!houseId) {
            throw new common_1.ServiceUnavailableException('Параметр houseId обязателен');
        }
        const r = this.zigbeeMqtt.requestBridgeDeviceList(houseId);
        if (!r.ok) {
            throw new common_1.ServiceUnavailableException(r.error);
        }
        return {
            ok: true,
            message: 'Запрос списка устройств отправлен в zigbee2mqtt; ответ придёт в bridge/devices и будет сохранён в БД.',
        };
    }
    upsertDevice(body) {
        const input = zigbee_schemas_1.upsertZigbeeDeviceSchema.parse(body);
        return this.service.upsertDevice(input);
    }
    permitJoin(body) {
        const b = body;
        const houseId = typeof b?.houseId === 'string' ? b.houseId : '';
        if (!houseId) {
            throw new common_1.ServiceUnavailableException('houseId обязателен');
        }
        const enable = Boolean(b?.enable);
        const time = typeof b?.time === 'number'
            ? Math.max(1, Math.min(254, Math.trunc(b.time)))
            : 254;
        const result = this.zigbeeMqtt.permitJoin(houseId, enable, time);
        if (!result.ok) {
            throw new common_1.ServiceUnavailableException(result.error ?? 'MQTT недоступен');
        }
        return { ok: true, enable, time: enable ? time : undefined };
    }
    createState(body) {
        const input = zigbee_schemas_1.createZigbeeStateSchema.parse(body);
        return this.service.createState(input);
    }
    listStates(query) {
        const q = zigbee_schemas_1.listZigbeeStatesQuerySchema.parse(query);
        return this.service.listStates(q);
    }
    listDeviceLogs(query) {
        const q = zigbee_schemas_1.listZigbeeDeviceLogsQuerySchema.parse(query);
        return this.service.listDeviceLogs(q);
    }
    createLinksBatch(body) {
        const input = zigbee_schemas_1.createZigbeeLinksBatchSchema.parse(body);
        return this.service.createLinksBatch(input);
    }
    listLinks(query) {
        const q = zigbee_schemas_1.listZigbeeLinksQuerySchema.parse(query);
        return this.service.listLinks(q);
    }
    async listHouseMqttConfigs() {
        const configs = await this.mqttConfigRepo.findAll();
        return configs.map(({ mqttPassword: _pwd, ...rest }) => ({
            ...rest,
            status: this.zigbeeMqtt.getConnectionStatus(rest.houseId),
        }));
    }
    getMqttStatuses() {
        return this.zigbeeMqtt.getAllStatuses();
    }
    async getHouseMqttConfig(houseId) {
        const config = await this.mqttConfigRepo.findByHouseId(houseId);
        if (!config)
            throw new common_1.NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
        const { mqttPassword: _pwd, ...rest } = config;
        return { ...rest, status: this.zigbeeMqtt.getConnectionStatus(houseId) };
    }
    async upsertHouseMqttConfig(houseId, body) {
        const b = body;
        const mqttUrl = typeof b.mqttUrl === 'string' ? b.mqttUrl.trim() : '';
        if (!mqttUrl)
            throw new common_1.UnprocessableEntityException('mqttUrl обязателен');
        const config = await this.mqttConfigRepo.upsert({
            houseId,
            mqttUrl,
            mqttUsername: typeof b.mqttUsername === 'string' ? b.mqttUsername : undefined,
            mqttPassword: typeof b.mqttPassword === 'string' ? b.mqttPassword : undefined,
            topicPrefix: typeof b.topicPrefix === 'string' ? b.topicPrefix : 'zigbee2mqtt',
            enabled: b.enabled !== false,
        });
        if (config.enabled) {
            this.zigbeeMqtt.connect(config);
        }
        else {
            this.zigbeeMqtt.disconnectHouse(houseId);
        }
        const { mqttPassword: _pwd, ...rest } = config;
        return { ...rest, status: this.zigbeeMqtt.getConnectionStatus(houseId) };
    }
    async deleteHouseMqttConfig(houseId) {
        const deleted = await this.mqttConfigRepo.deleteByHouseId(houseId);
        if (!deleted)
            throw new common_1.NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
        this.zigbeeMqtt.disconnectHouse(houseId);
        return { ok: true, houseId };
    }
    async reconnectHouseMqtt(houseId) {
        const config = await this.mqttConfigRepo.findByHouseId(houseId);
        if (!config)
            throw new common_1.NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
        this.zigbeeMqtt.connect(config);
        return { ok: true, houseId };
    }
};
exports.ZigbeeController = ZigbeeController;
__decorate([
    (0, common_1.Get)('devices'),
    (0, swagger_1.ApiOperation)({ summary: 'List Zigbee devices' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: zigbee_schemas_1.ZigbeeDeviceType,
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({
        name: 'houseId',
        required: false,
        type: String,
        description: 'Дом: только устройства с этим houseId',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Devices list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Get)('devices/:ieeeAddr'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Zigbee device by ieeeAddr' }),
    (0, swagger_1.ApiParam)({ name: 'ieeeAddr', description: 'Zigbee IEEE address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Device not found' }),
    __param(0, (0, common_1.Param)('ieeeAddr')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Delete)('devices/:ieeeAddr'),
    (0, swagger_1.ApiOperation)({
        summary: 'Удалить устройство из системы (полная рассинхронизация)',
        description: 'Удаляет устройство из MongoDB и отправляет команду удаления на Zigbee-координатор через MQTT. ' +
            'Также удаляет историю состояний и логи устройства. ' +
            'MQTT-команда выполняется best-effort: если мост недоступен, удаление из БД всё равно произойдёт.',
    }),
    (0, swagger_1.ApiParam)({ name: 'ieeeAddr', description: 'Zigbee IEEE address' }),
    (0, swagger_1.ApiQuery)({
        name: 'force',
        required: false,
        type: Boolean,
        description: 'Принудительное удаление (для недоступных устройств)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Устройство удалено' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Устройство не найдено' }),
    __param(0, (0, common_1.Param)('ieeeAddr')),
    __param(1, (0, common_1.Query)('force')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "removeDevice", null);
__decorate([
    (0, common_1.Post)('devices/:ieeeAddr/command'),
    (0, swagger_1.ApiOperation)({
        summary: 'Отправить команду управления Zigbee-устройству через MQTT (…/set)',
        description: 'Публикует payload в топик `zigbee2mqtt/<friendlyName>/set`. ' +
            'Примеры: `{"state":"ON"}`, `{"brightness":200}`, `{"color_temp":300}`.',
    }),
    (0, swagger_1.ApiParam)({ name: 'ieeeAddr', description: 'Zigbee IEEE address' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['payload'],
            properties: {
                payload: {
                    type: 'object',
                    additionalProperties: true,
                    example: { state: 'ON', brightness: 200 },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Команда отправлена' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Устройство не найдено' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'MQTT не подключён' }),
    __param(0, (0, common_1.Param)('ieeeAddr')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "sendCommand", null);
__decorate([
    (0, common_1.Post)('devices:sync-from-bridge'),
    (0, swagger_1.ApiOperation)({
        summary: 'Синхронизация списка устройств с zigbee2mqtt (MQTT request → bridge/devices → MongoDB)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'houseId',
        required: true,
        type: String,
        description: 'ID дома, для которого выполняется синхронизация',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запрос отправлен; при ответе брокера записи обновятся в PhysicalDevice',
    }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'MQTT не подключён' }),
    __param(0, (0, common_1.Query)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "requestDevicesSyncFromBridge", null);
__decorate([
    (0, common_1.Post)('devices:upsert'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert Zigbee device (by ieeeAddr)',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['ieeeAddr'],
            properties: {
                ieeeAddr: { type: 'string', example: '0xa4c1388fe1961a3d' },
                networkAddress: { type: 'number', example: 12345 },
                type: { type: 'string', enum: Object.values(zigbee_schemas_1.ZigbeeDeviceType) },
                manufacturerName: { type: 'string' },
                modelId: { type: 'string' },
                friendlyName: { type: 'string' },
                lastSeen: { type: 'string', format: 'date-time' },
                definition: { type: 'object', additionalProperties: true },
                capabilities: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Device upserted' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "upsertDevice", null);
__decorate([
    (0, common_1.Post)('permit-join'),
    (0, swagger_1.ApiOperation)({
        summary: 'Включить / выключить режим сопряжения (permit_join) на мосту zigbee2mqtt',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['houseId', 'enable'],
            properties: {
                houseId: {
                    type: 'string',
                    description: 'ID дома (UUID)',
                },
                enable: {
                    type: 'boolean',
                    description: 'true — включить, false — выключить',
                },
                time: {
                    type: 'number',
                    description: 'Таймаут в секундах (1–254), только при enable=true',
                    default: 254,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Команда отправлена' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'MQTT не подключён' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "permitJoin", null);
__decorate([
    (0, common_1.Post)('states'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ingest Zigbee device state (raw payload + normalized fields)',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['deviceIeeeAddr', 'payload'],
            properties: {
                deviceIeeeAddr: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                payload: { type: 'object', additionalProperties: true },
                state: { type: 'string', example: 'ON' },
                brightness: { type: 'number', example: 164 },
                linkquality: { type: 'number', example: 34 },
                colorMode: { type: 'string', example: 'xy' },
                occupancy: { type: 'boolean', example: true },
                temperature: { type: 'number', example: 23.5 },
                humidity: { type: 'number', example: 45.1 },
                battery: { type: 'number', example: 98 },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'State saved' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "createState", null);
__decorate([
    (0, common_1.Get)('states'),
    (0, swagger_1.ApiOperation)({ summary: 'List Zigbee device states' }),
    (0, swagger_1.ApiQuery)({ name: 'deviceIeeeAddr', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'States list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "listStates", null);
__decorate([
    (0, common_1.Get)('device-logs'),
    (0, swagger_1.ApiOperation)({
        summary: 'Логи устройств Zigbee (события состояния и др.; пишутся при приёме MQTT/API)',
    }),
    (0, swagger_1.ApiQuery)({ name: 'deviceIeeeAddr', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'physicalDeviceId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'kind',
        required: false,
        enum: ['state_ingest', 'bridge_event'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'source', required: false, enum: ['mqtt', 'api'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Device logs list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "listDeviceLogs", null);
__decorate([
    (0, common_1.Post)('links:batch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Ingest Zigbee network map links batch',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['links'],
            properties: {
                collectedAt: { type: 'string', format: 'date-time' },
                links: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['sourceDeviceId', 'targetDeviceId'],
                        properties: {
                            sourceDeviceId: { type: 'string' },
                            targetDeviceId: { type: 'string' },
                            protocol: { type: 'string', enum: Object.values(zigbee_schemas_1.Protocol) },
                            linkQuality: { type: 'number' },
                            rssi: { type: 'number' },
                            lqi: { type: 'number' },
                            metadata: { type: 'object', additionalProperties: true },
                        },
                    },
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Links saved' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "createLinksBatch", null);
__decorate([
    (0, common_1.Get)('links'),
    (0, swagger_1.ApiOperation)({ summary: 'List Zigbee network links' }),
    (0, swagger_1.ApiQuery)({ name: 'sourceDeviceId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'protocol', required: false, enum: zigbee_schemas_1.Protocol }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Links list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "listLinks", null);
__decorate([
    (0, common_1.Get)('house-mqtt'),
    (0, swagger_1.ApiOperation)({ summary: 'Список MQTT-конфигураций всех домов' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Массив конфигураций (без паролей)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "listHouseMqttConfigs", null);
__decorate([
    (0, common_1.Get)('house-mqtt/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Статус всех MQTT-соединений' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Карта houseId → {connected}' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ZigbeeController.prototype, "getMqttStatuses", null);
__decorate([
    (0, common_1.Get)('house-mqtt/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'MQTT-конфигурация конкретного дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', description: 'UUID дома' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Конфигурация (без пароля)' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Конфигурация не найдена' }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "getHouseMqttConfig", null);
__decorate([
    (0, common_1.Put)('house-mqtt/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Создать / обновить MQTT-конфигурацию дома и переподключиться' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', description: 'UUID дома' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['mqttUrl'],
            properties: {
                mqttUrl: { type: 'string', example: 'mqtt://192.168.1.10:1883' },
                mqttUsername: { type: 'string' },
                mqttPassword: { type: 'string' },
                topicPrefix: { type: 'string', default: 'zigbee2mqtt' },
                enabled: { type: 'boolean', default: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Конфигурация сохранена, соединение установлено' }),
    __param(0, (0, common_1.Param)('houseId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "upsertHouseMqttConfig", null);
__decorate([
    (0, common_1.Delete)('house-mqtt/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить MQTT-конфигурацию дома и отключиться' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', description: 'UUID дома' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Конфигурация удалена' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Конфигурация не найдена' }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "deleteHouseMqttConfig", null);
__decorate([
    (0, common_1.Post)('house-mqtt/:houseId/reconnect'),
    (0, swagger_1.ApiOperation)({ summary: 'Принудительное переподключение к MQTT для дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', description: 'UUID дома' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Переподключение инициировано' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Конфигурация не найдена' }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZigbeeController.prototype, "reconnectHouseMqtt", null);
exports.ZigbeeController = ZigbeeController = __decorate([
    (0, swagger_1.ApiTags)('Zigbee'),
    (0, common_1.Controller)('zigbee'),
    __metadata("design:paramtypes", [zigbee_service_1.ZigbeeService,
        zigbee_mqtt_service_1.ZigbeeMqttService,
        house_mqtt_config_repository_1.HouseMqttConfigRepository])
], ZigbeeController);
//# sourceMappingURL=zigbee.controller.js.map