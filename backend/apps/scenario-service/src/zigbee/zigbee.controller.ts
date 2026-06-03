import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZigbeeService } from './zigbee.service';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
import { HouseMqttConfigRepository } from './house-mqtt-config.repository';
import {
  createZigbeeLinksBatchSchema,
  createZigbeeStateSchema,
  listZigbeeDeviceLogsQuerySchema,
  listZigbeeDevicesQuerySchema,
  listZigbeeLinksQuerySchema,
  listZigbeeStatesQuerySchema,
  Protocol,
  upsertZigbeeDeviceSchema,
  zigbeeCommandSchema,
  ZigbeeDeviceType,
} from './schemas/zigbee.schemas';

@ApiTags('Zigbee')
@Controller('zigbee')
export class ZigbeeController {
  constructor(
    private readonly service: ZigbeeService,
    private readonly zigbeeMqtt: ZigbeeMqttService,
    private readonly mqttConfigRepo: HouseMqttConfigRepository,
  ) {}

  @Get('devices')
  @ApiOperation({ summary: 'List Zigbee devices' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ZigbeeDeviceType,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'houseId',
    required: false,
    type: String,
    description: 'Дом: только устройства с этим houseId',
  })
  @ApiResponse({ status: 200, description: 'Devices list' })
  listDevices(@Query() query: unknown) {
    const q = listZigbeeDevicesQuerySchema.parse(query);
    return this.service.listDevices(q);
  }

  @Get('devices/:ieeeAddr')
  @ApiOperation({ summary: 'Get Zigbee device by ieeeAddr' })
  @ApiParam({ name: 'ieeeAddr', description: 'Zigbee IEEE address' })
  @ApiResponse({ status: 200, description: 'Device found' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(@Param('ieeeAddr') ieeeAddr: string) {
    const device = await this.service.getDeviceByIeeeAddr(ieeeAddr);
    if (!device)
      throw new NotFoundException(`ZigbeeDevice ${ieeeAddr} not found`);
    return device;
  }

  @Delete('devices/:ieeeAddr')
  @ApiOperation({
    summary: 'Удалить устройство из системы (полная рассинхронизация)',
    description:
      'Удаляет устройство из MongoDB и отправляет команду удаления на Zigbee-координатор через MQTT. ' +
      'Также удаляет историю состояний и логи устройства. ' +
      'MQTT-команда выполняется best-effort: если мост недоступен, удаление из БД всё равно произойдёт.',
  })
  @ApiParam({ name: 'ieeeAddr', description: 'Zigbee IEEE address' })
  @ApiQuery({
    name: 'force',
    required: false,
    type: Boolean,
    description: 'Принудительное удаление (для недоступных устройств)',
  })
  @ApiResponse({ status: 200, description: 'Устройство удалено' })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  async removeDevice(
    @Param('ieeeAddr') ieeeAddr: string,
    @Query('force') force?: string,
  ) {
    const result = await this.service.removeDevice(ieeeAddr, force === 'true');
    if (!result.ok) {
      throw new NotFoundException(result.error);
    }
    return { ok: true, deleted: result.device };
  }

  @Post('devices/:ieeeAddr/command')
  @ApiOperation({
    summary:
      'Отправить команду управления Zigbee-устройству через MQTT (…/set)',
    description:
      'Публикует payload в топик `zigbee2mqtt/<friendlyName>/set`. ' +
      'Примеры: `{"state":"ON"}`, `{"brightness":200}`, `{"color_temp":300}`.',
  })
  @ApiParam({ name: 'ieeeAddr', description: 'Zigbee IEEE address' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'Команда отправлена' })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  @ApiResponse({ status: 503, description: 'MQTT не подключён' })
  async sendCommand(
    @Param('ieeeAddr') ieeeAddr: string,
    @Body() body: unknown,
  ) {
    const { payload } = zigbeeCommandSchema.parse(body);
    const result = await this.service.sendCommand(ieeeAddr, payload);
    if (!result.ok) {
      if (result.error.includes('не найдено')) {
        throw new NotFoundException(result.error);
      }
      throw new ServiceUnavailableException(result.error);
    }
    return { ok: true, topic: result.topic };
  }

  @Post('devices:sync-from-bridge')
  @ApiOperation({
    summary:
      'Синхронизация списка устройств с zigbee2mqtt (MQTT request → bridge/devices → MongoDB)',
  })
  @ApiQuery({
    name: 'houseId',
    required: true,
    type: String,
    description: 'ID дома, для которого выполняется синхронизация',
  })
  @ApiResponse({
    status: 200,
    description:
      'Запрос отправлен; при ответе брокера записи обновятся в PhysicalDevice',
  })
  @ApiResponse({ status: 503, description: 'MQTT не подключён' })
  requestDevicesSyncFromBridge(@Query('houseId') houseId: string) {
    if (!houseId) {
      throw new ServiceUnavailableException('Параметр houseId обязателен');
    }
    const r = this.zigbeeMqtt.requestBridgeDeviceList(houseId);
    if (!r.ok) {
      throw new ServiceUnavailableException(r.error);
    }
    return {
      ok: true,
      message:
        'Запрос списка устройств отправлен в zigbee2mqtt; ответ придёт в bridge/devices и будет сохранён в БД.',
    };
  }

  @Post('devices:upsert')
  @ApiOperation({
    summary: 'Upsert Zigbee device (by ieeeAddr)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ieeeAddr'],
      properties: {
        ieeeAddr: { type: 'string', example: '0xa4c1388fe1961a3d' },
        networkAddress: { type: 'number', example: 12345 },
        type: { type: 'string', enum: Object.values(ZigbeeDeviceType) },
        manufacturerName: { type: 'string' },
        modelId: { type: 'string' },
        friendlyName: { type: 'string' },
        lastSeen: { type: 'string', format: 'date-time' },
        definition: { type: 'object', additionalProperties: true },
        capabilities: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Device upserted' })
  upsertDevice(@Body() body: unknown) {
    const input = upsertZigbeeDeviceSchema.parse(body);
    return this.service.upsertDevice(input);
  }

  @Post('permit-join')
  @ApiOperation({
    summary:
      'Включить / выключить режим сопряжения (permit_join) на мосту zigbee2mqtt',
  })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'Команда отправлена' })
  @ApiResponse({ status: 503, description: 'MQTT не подключён' })
  permitJoin(@Body() body: unknown) {
    const b = body as Record<string, unknown>;
    const houseId = typeof b?.houseId === 'string' ? b.houseId : '';
    if (!houseId) {
      throw new ServiceUnavailableException('houseId обязателен');
    }
    const enable = Boolean(b?.enable);
    const time =
      typeof b?.time === 'number'
        ? Math.max(1, Math.min(254, Math.trunc(b.time)))
        : 254;
    const result = this.zigbeeMqtt.permitJoin(houseId, enable, time);
    if (!result.ok) {
      throw new ServiceUnavailableException(
        (result as { ok: false; error: string }).error ?? 'MQTT недоступен',
      );
    }
    return { ok: true, enable, time: enable ? time : undefined };
  }

  @Post('states')
  @ApiOperation({
    summary: 'Ingest Zigbee device state (raw payload + normalized fields)',
  })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: 'State saved' })
  createState(@Body() body: unknown) {
    const input = createZigbeeStateSchema.parse(body);
    return this.service.createState(input);
  }

  @Get('states')
  @ApiOperation({ summary: 'List Zigbee device states' })
  @ApiQuery({ name: 'deviceIeeeAddr', required: true, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'States list' })
  listStates(@Query() query: unknown) {
    const q = listZigbeeStatesQuerySchema.parse(query);
    return this.service.listStates(q);
  }

  @Get('device-logs')
  @ApiOperation({
    summary:
      'Логи устройств Zigbee (события состояния и др.; пишутся при приёме MQTT/API)',
  })
  @ApiQuery({ name: 'deviceIeeeAddr', required: false, type: String })
  @ApiQuery({ name: 'physicalDeviceId', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: ['state_ingest', 'bridge_event'],
  })
  @ApiQuery({ name: 'source', required: false, enum: ['mqtt', 'api'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Device logs list' })
  listDeviceLogs(@Query() query: unknown) {
    const q = listZigbeeDeviceLogsQuerySchema.parse(query);
    return this.service.listDeviceLogs(q);
  }

  @Post('links:batch')
  @ApiOperation({
    summary: 'Ingest Zigbee network map links batch',
  })
  @ApiBody({
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
              protocol: { type: 'string', enum: Object.values(Protocol) },
              linkQuality: { type: 'number' },
              rssi: { type: 'number' },
              lqi: { type: 'number' },
              metadata: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Links saved' })
  createLinksBatch(@Body() body: unknown) {
    const input = createZigbeeLinksBatchSchema.parse(body);
    return this.service.createLinksBatch(input);
  }

  @Get('links')
  @ApiOperation({ summary: 'List Zigbee network links' })
  @ApiQuery({ name: 'sourceDeviceId', required: false, type: String })
  @ApiQuery({ name: 'protocol', required: false, enum: Protocol })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Links list' })
  listLinks(@Query() query: unknown) {
    const q = listZigbeeLinksQuerySchema.parse(query);
    return this.service.listLinks(q);
  }

  @Get('house-mqtt')
  @ApiOperation({ summary: 'Список MQTT-конфигураций всех домов' })
  @ApiResponse({ status: 200, description: 'Массив конфигураций (без паролей)' })
  async listHouseMqttConfigs() {
    const configs = await this.mqttConfigRepo.findAll();
    return configs.map(({ mqttPassword: _pwd, ...rest }) => ({
      ...rest,
      status: this.zigbeeMqtt.getConnectionStatus(rest.houseId),
    }));
  }

  @Get('house-mqtt/status')
  @ApiOperation({ summary: 'Статус всех MQTT-соединений' })
  @ApiResponse({ status: 200, description: 'Карта houseId → {connected}' })
  getMqttStatuses() {
    return this.zigbeeMqtt.getAllStatuses();
  }

  @Get('house-mqtt/:houseId')
  @ApiOperation({ summary: 'MQTT-конфигурация конкретного дома' })
  @ApiParam({ name: 'houseId', description: 'UUID дома' })
  @ApiResponse({ status: 200, description: 'Конфигурация (без пароля)' })
  @ApiResponse({ status: 404, description: 'Конфигурация не найдена' })
  async getHouseMqttConfig(@Param('houseId') houseId: string) {
    const config = await this.mqttConfigRepo.findByHouseId(houseId);
    if (!config) throw new NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
    const { mqttPassword: _pwd, ...rest } = config;
    return { ...rest, status: this.zigbeeMqtt.getConnectionStatus(houseId) };
  }

  @Put('house-mqtt/:houseId')
  @ApiOperation({ summary: 'Создать / обновить MQTT-конфигурацию дома и переподключиться' })
  @ApiParam({ name: 'houseId', description: 'UUID дома' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 200, description: 'Конфигурация сохранена, соединение установлено' })
  async upsertHouseMqttConfig(
    @Param('houseId') houseId: string,
    @Body() body: unknown,
  ) {
    const b = body as Record<string, unknown>;
    const mqttUrl = typeof b.mqttUrl === 'string' ? b.mqttUrl.trim() : '';
    if (!mqttUrl) throw new UnprocessableEntityException('mqttUrl обязателен');

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
    } else {
      this.zigbeeMqtt.disconnectHouse(houseId);
    }

    const { mqttPassword: _pwd, ...rest } = config;
    return { ...rest, status: this.zigbeeMqtt.getConnectionStatus(houseId) };
  }

  @Delete('house-mqtt/:houseId')
  @ApiOperation({ summary: 'Удалить MQTT-конфигурацию дома и отключиться' })
  @ApiParam({ name: 'houseId', description: 'UUID дома' })
  @ApiResponse({ status: 200, description: 'Конфигурация удалена' })
  @ApiResponse({ status: 404, description: 'Конфигурация не найдена' })
  async deleteHouseMqttConfig(@Param('houseId') houseId: string) {
    const deleted = await this.mqttConfigRepo.deleteByHouseId(houseId);
    if (!deleted) throw new NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
    this.zigbeeMqtt.disconnectHouse(houseId);
    return { ok: true, houseId };
  }

  @Post('house-mqtt/:houseId/reconnect')
  @ApiOperation({ summary: 'Принудительное переподключение к MQTT для дома' })
  @ApiParam({ name: 'houseId', description: 'UUID дома' })
  @ApiResponse({ status: 200, description: 'Переподключение инициировано' })
  @ApiResponse({ status: 404, description: 'Конфигурация не найдена' })
  async reconnectHouseMqtt(@Param('houseId') houseId: string) {
    const config = await this.mqttConfigRepo.findByHouseId(houseId);
    if (!config) throw new NotFoundException(`MQTT-конфигурация для дома ${houseId} не найдена`);
    this.zigbeeMqtt.connect(config);
    return { ok: true, houseId };
  }
}
