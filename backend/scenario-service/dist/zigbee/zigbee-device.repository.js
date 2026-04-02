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
exports.ZigbeeDeviceRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const pagination_1 = require("../common/schemas/pagination");
const physical_device_mongo_1 = require("../mongo/schemas/physical-device.mongo");
let ZigbeeDeviceRepository = class ZigbeeDeviceRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, protocolAddress } = doc.toObject();
        if (!protocolAddress) {
            throw new Error('Invariant: zigbee info is missing');
        }
        return {
            id: _id.toHexString(),
            physicalDeviceId: _id.toHexString(),
            ieeeAddr: protocolAddress,
            networkAddress: doc.networkAddress ?? null,
            type: doc.type,
            manufacturerName: doc.manufacturerName ?? null,
            modelId: doc.model ?? null,
            friendlyName: doc.friendlyName ?? null,
            lastSeen: doc.lastSeen ?? null,
            definition: doc.definition ?? null,
            capabilities: doc.capabilities ?? [],
        };
    }
    async upsertByIeeeAddr(input) {
        const now = new Date();
        const updated = await this.model
            .findOneAndUpdate({ protocolAddress: input.ieeeAddr }, {
            $set: {
                ...(input.friendlyName
                    ? { name: input.friendlyName }
                    : { name: input.ieeeAddr }),
                protocolAddress: input.ieeeAddr,
                ...('networkAddress' in input
                    ? { networkAddress: input.networkAddress ?? null }
                    : {}),
                ...('type' in input ? { type: input.type } : {}),
                ...('manufacturerName' in input
                    ? { manufacturerName: input.manufacturerName ?? null }
                    : {}),
                ...('modelId' in input ? { model: input.modelId ?? null } : {}),
                ...('friendlyName' in input
                    ? { friendlyName: input.friendlyName ?? null }
                    : {}),
                ...('lastSeen' in input ? { lastSeen: input.lastSeen ?? null } : {}),
                ...('definition' in input
                    ? { definition: input.definition ?? null }
                    : {}),
                ...(input.capabilities ? { capabilities: input.capabilities } : {}),
                updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
        }, { new: true, upsert: true })
            .exec();
        return this.map(updated);
    }
    async findByIeeeAddr(ieeeAddr) {
        const doc = await this.model.findOne({ protocolAddress: ieeeAddr }).exec();
        return doc ? this.map(doc) : null;
    }
    async findMany(query) {
        const filter = { protocolAddress: { $ne: null } };
        if (query.type)
            filter.type = query.type;
        if (query.q) {
            filter.$or = [
                { protocolAddress: { $regex: query.q, $options: 'i' } },
                { friendlyName: { $regex: query.q, $options: 'i' } },
                { model: { $regex: query.q, $options: 'i' } },
                { manufacturerName: { $regex: query.q, $options: 'i' } },
            ];
        }
        const { skip, take } = (0, pagination_1.skipTake)({ page: query.page, limit: query.limit });
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items: items.map((d) => this.map(d)), total };
    }
};
exports.ZigbeeDeviceRepository = ZigbeeDeviceRepository;
exports.ZigbeeDeviceRepository = ZigbeeDeviceRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(physical_device_mongo_1.PHYSICAL_DEVICE_MODEL)),
    __metadata("design:paramtypes", [Function])
], ZigbeeDeviceRepository);
//# sourceMappingURL=zigbee-device.repository.js.map