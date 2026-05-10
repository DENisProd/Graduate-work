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
exports.DeviceDataRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pagination_1 = require("../common/schemas/pagination");
const device_data_mongo_1 = require("../mongo/schemas/device-data.mongo");
const enums_1 = require("../common/schemas/enums");
let DeviceDataRepository = class DeviceDataRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, ...rest } = doc.toObject();
        return { ...rest, id: _id.toHexString() };
    }
    async create(input) {
        const doc = await this.model.create({ ...input });
        return this.map(doc);
    }
    async findById(id) {
        if (!(0, mongoose_2.isValidObjectId)(id))
            return null;
        const doc = await this.model.findById(id).exec();
        return doc ? this.map(doc) : null;
    }
    async findMany(params) {
        const filter = {};
        if (params.deviceId)
            filter.deviceId = params.deviceId;
        if (params.capability)
            filter.capability = params.capability;
        if (params.attribute)
            filter.attribute = params.attribute;
        if (params.type)
            filter.type = params.type;
        if (params.from ?? params.to) {
            filter.timestamp = {};
            if (params.from)
                filter.timestamp.$gte = params.from;
            if (params.to)
                filter.timestamp.$lte = params.to;
        }
        const { skip, take } = (0, pagination_1.skipTake)({ page: params.page, limit: params.limit });
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items: items.map((item) => this.map(item)), total };
    }
    bucketForRange(range) {
        switch (range) {
            case '1m':
                return { unit: 'minute', binSize: 1 };
            case '1h':
                return { unit: 'minute', binSize: 1 };
            case '6h':
                return { unit: 'minute', binSize: 5 };
            case '24h':
                return { unit: 'minute', binSize: 15 };
            case '7d':
            default:
                return { unit: 'hour', binSize: 1 };
        }
    }
    booleanBucketForRange(range) {
        switch (range) {
            case '1m':
            case '1h':
            case '6h':
            case '24h':
                return { unit: 'minute', binSize: 1 };
            case '7d':
            default:
                return { unit: 'minute', binSize: 15 };
        }
    }
    msForRange(range) {
        switch (range) {
            case '1m':
                return 60_000;
            case '1h':
                return 3_600_000;
            case '6h':
                return 21_600_000;
            case '24h':
                return 86_400_000;
            case '7d':
            default:
                return 604_800_000;
        }
    }
    async series(params) {
        const to = params.to ?? new Date();
        const from = new Date(to.getTime() - this.msForRange(params.range));
        const numericBucket = this.bucketForRange(params.range);
        const boolBucket = this.booleanBucketForRange(params.range);
        const match = {
            deviceId: params.deviceId,
            timestamp: { $gte: from, $lte: to },
        };
        if (params.capabilities && params.capabilities.length > 0) {
            match.capability = { $in: params.capabilities };
        }
        const numericValue = {
            $switch: {
                branches: [
                    {
                        case: { $eq: ['$type', enums_1.DeviceDataType.BOOLEAN] },
                        then: { $cond: [{ $eq: ['$valueRaw', true] }, 1, 0] },
                    },
                    {
                        case: { $in: ['$type', [enums_1.DeviceDataType.NUMBER, enums_1.DeviceDataType.FLOAT]] },
                        then: {
                            $let: {
                                vars: {
                                    v: '$valueRaw',
                                    v2: '$valueRaw.value',
                                },
                                in: {
                                    $cond: [
                                        { $in: [{ $type: '$$v' }, ['int', 'long', 'double', 'decimal']] },
                                        '$$v',
                                        {
                                            $cond: [
                                                { $in: [{ $type: '$$v2' }, ['int', 'long', 'double', 'decimal']] },
                                                '$$v2',
                                                {
                                                    $convert: {
                                                        input: {
                                                            $cond: [
                                                                { $eq: [{ $type: '$$v2' }, 'string'] },
                                                                '$$v2',
                                                                { $toString: '$$v' },
                                                            ],
                                                        },
                                                        to: 'double',
                                                        onError: null,
                                                        onNull: null,
                                                    },
                                                },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        case: { $eq: ['$type', enums_1.DeviceDataType.STRING] },
                        then: {
                            $let: {
                                vars: { s: { $toLower: { $toString: '$valueRaw' } } },
                                in: {
                                    $cond: [
                                        { $in: ['$$s', ['on', 'true', '1', 'yes']] },
                                        1,
                                        {
                                            $cond: [
                                                { $in: ['$$s', ['off', 'false', '0', 'no']] },
                                                0,
                                                null,
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
                default: null,
            },
        };
        const bucketTs = {
            $cond: {
                if: { $eq: ['$type', enums_1.DeviceDataType.BOOLEAN] },
                then: {
                    $dateTrunc: {
                        date: '$timestamp',
                        unit: boolBucket.unit,
                        binSize: boolBucket.binSize,
                    },
                },
                else: {
                    $dateTrunc: {
                        date: '$timestamp',
                        unit: numericBucket.unit,
                        binSize: numericBucket.binSize,
                    },
                },
            },
        };
        const rows = await this.model
            .aggregate([
            { $match: match },
            {
                $project: {
                    capability: 1,
                    attribute: { $ifNull: ['$attribute', null] },
                    unit: { $ifNull: ['$unit', null] },
                    type: 1,
                    valueRaw: '$value',
                    timestamp: 1,
                },
            },
            {
                $addFields: {
                    numeric: numericValue,
                    bucket: bucketTs,
                },
            },
            { $match: { numeric: { $ne: null } } },
            { $sort: { timestamp: 1 } },
            {
                $group: {
                    _id: {
                        capability: '$capability',
                        attribute: '$attribute',
                        bucket: '$bucket',
                    },
                    unit: { $first: '$unit' },
                    last: { $last: '$numeric' },
                    avg: { $avg: '$numeric' },
                    types: { $addToSet: '$type' },
                },
            },
            {
                $project: {
                    capability: '$_id.capability',
                    attribute: '$_id.attribute',
                    ts: '$_id.bucket',
                    unit: 1,
                    value: {
                        $cond: [
                            { $in: [enums_1.DeviceDataType.BOOLEAN, '$types'] },
                            '$last',
                            '$avg',
                        ],
                    },
                },
            },
            { $sort: { ts: 1 } },
        ])
            .exec();
        const map = new Map();
        for (const r of rows) {
            const key = `${r.capability}:${r.attribute ?? ''}`;
            const existing = map.get(key) ??
                {
                    key,
                    capability: r.capability,
                    attribute: r.attribute ?? null,
                    unit: r.unit ?? null,
                    points: [],
                };
            existing.points.push({ ts: r.ts, value: r.value });
            map.set(key, existing);
        }
        return { from, to, series: [...map.values()] };
    }
    async delete(id) {
        if (!(0, mongoose_2.isValidObjectId)(id)) {
            throw new Error('Invalid ObjectId');
        }
        const deleted = await this.model.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new Error('DeviceData not found');
        }
        return this.map(deleted);
    }
};
exports.DeviceDataRepository = DeviceDataRepository;
exports.DeviceDataRepository = DeviceDataRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_data_mongo_1.DEVICE_DATA_MODEL)),
    __metadata("design:paramtypes", [Function])
], DeviceDataRepository);
//# sourceMappingURL=device-data.repository.js.map