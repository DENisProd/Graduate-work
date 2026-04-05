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
exports.ZigbeeLinkRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pagination_1 = require("../common/schemas/pagination");
const device_network_link_mongo_1 = require("../mongo/schemas/device-network-link.mongo");
let ZigbeeLinkRepository = class ZigbeeLinkRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, ...rest } = doc.toObject();
        return { ...rest, id: _id.toHexString() };
    }
    async createMany(input) {
        const collectedAt = input.collectedAt ?? new Date();
        const docs = await this.model.insertMany(input.links.map((l) => ({
            sourceDeviceId: new mongoose_2.Types.ObjectId(l.sourceDeviceId),
            targetDeviceId: new mongoose_2.Types.ObjectId(l.targetDeviceId),
            protocol: l.protocol,
            linkQuality: l.linkQuality ?? null,
            rssi: l.rssi ?? null,
            lqi: l.lqi ?? null,
            metadata: l.metadata ?? null,
            collectedAt,
        })), { ordered: false });
        return { items: docs.map((d) => this.map(d)), inserted: docs.length };
    }
    async findMany(query) {
        const filter = {};
        if (query.sourceDeviceId && (0, mongoose_2.isValidObjectId)(query.sourceDeviceId)) {
            filter.sourceDeviceId = new mongoose_2.Types.ObjectId(query.sourceDeviceId);
        }
        if (query.protocol)
            filter.protocol = query.protocol;
        if (query.from ?? query.to) {
            filter.collectedAt = {};
            if (query.from)
                filter.collectedAt.$gte = query.from;
            if (query.to)
                filter.collectedAt.$lte = query.to;
        }
        const { skip, take } = (0, pagination_1.skipTake)({ page: query.page, limit: query.limit });
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ collectedAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items: items.map((d) => this.map(d)), total };
    }
};
exports.ZigbeeLinkRepository = ZigbeeLinkRepository;
exports.ZigbeeLinkRepository = ZigbeeLinkRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(device_network_link_mongo_1.DEVICE_NETWORK_LINK_MODEL)),
    __metadata("design:paramtypes", [Function])
], ZigbeeLinkRepository);
//# sourceMappingURL=zigbee-link.repository.js.map