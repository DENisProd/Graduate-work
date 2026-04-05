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
exports.ZigbeeDeviceLogRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pagination_1 = require("../common/schemas/pagination");
const zigbee_device_log_mongo_1 = require("../mongo/schemas/zigbee-device-log.mongo");
let ZigbeeDeviceLogRepository = class ZigbeeDeviceLogRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, ...rest } = doc.toObject();
        return { ...rest, id: _id.toHexString() };
    }
    async create(input) {
        const doc = await this.model.create({
            deviceIeeeAddr: input.deviceIeeeAddr,
            physicalDeviceId: input.physicalDeviceId ?? null,
            timestamp: input.timestamp ?? new Date(),
            source: input.source,
            kind: input.kind,
            message: input.message ?? null,
            metrics: input.metrics ?? null,
            payloadKeys: input.payloadKeys ?? [],
            stateDocumentId: input.stateDocumentId ?? null,
            metadata: input.metadata ?? null,
        });
        return this.map(doc);
    }
    async appendFromState(params) {
        await this.create({
            deviceIeeeAddr: params.state.deviceIeeeAddr,
            physicalDeviceId: params.physicalDeviceId ?? null,
            timestamp: params.state.timestamp,
            source: params.source,
            kind: zigbee_device_log_mongo_1.ZigbeeDeviceLogKind.StateIngest,
            metrics: {
                state: params.state.state ?? null,
                brightness: params.state.brightness ?? null,
                linkquality: params.state.linkquality ?? null,
                colorMode: params.state.colorMode ?? null,
                occupancy: params.state.occupancy ?? null,
                temperature: params.state.temperature ?? null,
                humidity: params.state.humidity ?? null,
                battery: params.state.battery ?? null,
            },
            payloadKeys: params.payloadKeys,
            stateDocumentId: params.state.id,
        });
    }
    async findMany(query) {
        const filter = {};
        if (query.deviceIeeeAddr)
            filter.deviceIeeeAddr = query.deviceIeeeAddr;
        if (query.physicalDeviceId)
            filter.physicalDeviceId = query.physicalDeviceId;
        if (query.from ?? query.to) {
            filter.timestamp = {};
            if (query.from)
                filter.timestamp.$gte = query.from;
            if (query.to)
                filter.timestamp.$lte = query.to;
        }
        if (query.kind)
            filter.kind = query.kind;
        if (query.source)
            filter.source = query.source;
        const { skip, take } = (0, pagination_1.skipTake)({ page: query.page, limit: query.limit });
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items: items.map((d) => this.map(d)), total };
    }
};
exports.ZigbeeDeviceLogRepository = ZigbeeDeviceLogRepository;
exports.ZigbeeDeviceLogRepository = ZigbeeDeviceLogRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(zigbee_device_log_mongo_1.ZIGBEE_DEVICE_LOG_MODEL)),
    __metadata("design:paramtypes", [Function])
], ZigbeeDeviceLogRepository);
//# sourceMappingURL=zigbee-device-log.repository.js.map