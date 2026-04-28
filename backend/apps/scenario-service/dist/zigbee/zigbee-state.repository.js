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
exports.ZigbeeStateRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pagination_1 = require("../common/schemas/pagination");
const zigbee_state_mongo_1 = require("../mongo/schemas/zigbee-state.mongo");
let ZigbeeStateRepository = class ZigbeeStateRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, ...rest } = doc.toObject();
        return { ...rest, id: _id.toHexString() };
    }
    async create(input) {
        const timestamp = input.timestamp ?? new Date();
        const doc = await this.model.create({
            deviceIeeeAddr: input.deviceIeeeAddr,
            timestamp,
            payload: input.payload,
            state: input.state ?? null,
            brightness: input.brightness ?? null,
            linkquality: input.linkquality ?? null,
            colorMode: input.colorMode ?? null,
            occupancy: input.occupancy ?? null,
            temperature: input.temperature ?? null,
            humidity: input.humidity ?? null,
            battery: input.battery ?? null,
        });
        return this.map(doc);
    }
    mapPlain(doc) {
        const { _id, ...rest } = doc;
        return {
            ...rest,
            id: _id.toHexString(),
        };
    }
    async findLatestByDeviceIeeeAddrs(deviceIeeeAddrs) {
        const unique = [...new Set(deviceIeeeAddrs)].filter((s) => s.length >= 3);
        const out = new Map();
        if (unique.length === 0)
            return out;
        const pipeline = [
            { $match: { deviceIeeeAddr: { $in: unique } } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$deviceIeeeAddr',
                    doc: { $first: '$$ROOT' },
                },
            },
        ];
        const rows = await this.model.aggregate(pipeline).exec();
        for (const row of rows) {
            if (typeof row._id === 'string') {
                out.set(row._id, this.mapPlain(row.doc));
            }
        }
        return out;
    }
    async deleteManyByIeeeAddr(ieeeAddr) {
        const result = await this.model.deleteMany({ deviceIeeeAddr: ieeeAddr }).exec();
        return result.deletedCount ?? 0;
    }
    async findMany(query) {
        const filter = {
            deviceIeeeAddr: query.deviceIeeeAddr,
        };
        if (query.from ?? query.to) {
            filter.timestamp = {};
            if (query.from)
                filter.timestamp.$gte = query.from;
            if (query.to)
                filter.timestamp.$lte = query.to;
        }
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
exports.ZigbeeStateRepository = ZigbeeStateRepository;
exports.ZigbeeStateRepository = ZigbeeStateRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(zigbee_state_mongo_1.ZIGBEE_STATE_MODEL)),
    __metadata("design:paramtypes", [Object])
], ZigbeeStateRepository);
//# sourceMappingURL=zigbee-state.repository.js.map