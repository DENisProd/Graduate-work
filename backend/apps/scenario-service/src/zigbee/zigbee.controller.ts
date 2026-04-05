import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
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
import {
  createZigbeeLinksBatchSchema,
  createZigbeeStateSchema,
  listZigbeeDeviceLogsQuerySchema,
  listZigbeeDevicesQuerySchema,
  listZigbeeLinksQuerySchema,
  listZigbeeStatesQuerySchema,
  Protocol,
  upsertZigbeeDeviceSchema,
  ZigbeeDeviceType,
} from './schemas/zigbee.schemas';

@ApiTags('Zigbee')
@Controller('zigbee')
export class ZigbeeController {
  constructor(
    private readonly service: ZigbeeService,
    private readonly zigbeeMqtt: ZigbeeMqttService,
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
    description: 'Дом: устройства с этим houseId или без привязки к дому',
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

  @Post('devices:sync-from-bridge')
  @ApiOperation({
    summary:
      'Синхронизация списка устройств с zigbee2mqtt (MQTT request → bridge/devices → MongoDB)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Запрос отправлен; при ответе брокера записи обновятся в PhysicalDevice',
  })
  @ApiResponse({ status: 503, description: 'MQTT не подключён' })
  requestDevicesSyncFromBridge() {
    const r = this.zigbeeMqtt.requestBridgeDeviceList();
    if (!r.ok) {
      throw new ServiceUnavailableException(
        r.error ?? 'MQTT недоступен. Задайте ZIGBEE_MQTT_URL и дождитесь подключения.',
      );
    }
    return {
      ok: true,
      message:
        'Запрос списка устройств отправлен в zigbee2mqtt; ответ придёт в bridge/devices и будет сохранён в БД.',
    };
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
}
