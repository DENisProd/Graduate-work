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
exports.canonicalZigbeeIeeeAddr = canonicalZigbeeIeeeAddr;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pagination_1 = require("../common/schemas/pagination");
const physical_device_mongo_1 = require("../mongo/schemas/physical-device.mongo");
function canonicalZigbeeIeeeAddr(ieee) {
    const t = ieee.trim();
    const m = /^0x([0-9a-fA-F]{16})$/i.exec(t);
    if (m)
        return `0x${m[1].toLowerCase()}`;
    return t;
}
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
            deviceId: doc.deviceId ?? null,
            deviceCategoryId: doc.deviceCategoryId ?? null,
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
        const ieeeAddr = canonicalZigbeeIeeeAddr(input.ieeeAddr);
        const now = new Date();
        const existing = await this.findByIeeeAddr(ieeeAddr);
        const filter = existing
            ? { _id: new mongoose_2.Types.ObjectId(existing.id) }
            : { protocolAddress: ieeeAddr };
        const updated = await this.model
            .findOneAndUpdate(filter, {
            $set: {
                ...(input.friendlyName
                    ? { name: input.friendlyName }
                    : { name: ieeeAddr }),
                protocolAddress: ieeeAddr,
                ...('networkAddress' in input
                    ? { networkAddress: input.networkAddress ?? null }
                    : {}),
                ...('type' in input ? { type: input.type } : {}),
                ...('manufacturerName' in input
                    ? { manufacturerName: input.manufacturerName ?? null }
                    : {}),
                ...('modelId' in input ? { model: input.modelId ?? null } : {}),
                ...('deviceId' in input
                    ? { deviceId: input.deviceId ?? null }
                    : {}),
                ...('deviceCategoryId' in input
                    ? { deviceCategoryId: input.deviceCategoryId ?? null }
                    : {}),
                ...('friendlyName' in input
                    ? { friendlyName: input.friendlyName ?? null }
                    : {}),
                ...('lastSeen' in input
                    ? { lastSeen: input.lastSeen ?? null }
                    : {}),
                ...('definition' in input
                    ? { definition: input.definition ?? null }
                    : {}),
                ...(input.capabilities ? { capabilities: input.capabilities } : {}),
                updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
        }, { returnDocument: 'after', upsert: !existing })
            .exec();
        if (!updated) {
            throw new Error('findOneAndUpdate returned no document');
        }
        return this.map(updated);
    }
    async touchLastSeen(ieeeAddr, at = new Date()) {
        const dev = await this.findByIeeeAddr(ieeeAddr);
        if (!dev)
            return;
        await this.model
            .updateOne({ _id: new mongoose_2.Types.ObjectId(dev.id) }, { $set: { lastSeen: at, updatedAt: at } })
            .exec();
    }
    async findByIeeeAddr(ieeeAddr) {
        const t = ieeeAddr.trim();
        const m = /^0x([0-9a-fA-F]{16})$/i.exec(t);
        if (m) {
            const canonical = `0x${m[1].toLowerCase()}`;
            const doc = await this.model
                .findOne({
                protocolAddress: { $ne: null },
                $expr: {
                    $eq: [{ $toLower: '$protocolAddress' }, canonical],
                },
            })
                .exec();
            return doc ? this.map(doc) : null;
        }
        const doc = await this.model.findOne({ protocolAddress: t }).exec();
        return doc ? this.map(doc) : null;
    }
    async findByFriendlyName(friendlyName) {
        const doc = await this.model
            .findOne({
            friendlyName,
            protocolAddress: { $ne: null },
        })
            .exec();
        return doc ? this.map(doc) : null;
    }
    async findIeeeAddrsByPhysicalIds(ids) {
        const valid = ids.filter((id) => (0, mongoose_2.isValidObjectId)(id));
        const out = new Map();
        if (valid.length === 0)
            return out;
        const oid = valid.map((id) => new mongoose_2.Types.ObjectId(id));
        const docs = await this.model
            .find({
            _id: { $in: oid },
            protocolAddress: { $ne: null, $exists: true },
        })
            .select({ _id: 1, protocolAddress: 1 })
            .exec();
        for (const d of docs) {
            const pa = d.protocolAddress;
            if (typeof pa === 'string' && pa.length >= 3) {
                out.set(d._id.toHexString(), pa);
            }
        }
        return out;
    }
    async deleteByIeeeAddr(ieeeAddr) {
        const canonical = canonicalZigbeeIeeeAddr(ieeeAddr);
        const dev = await this.findByIeeeAddr(canonical);
        if (!dev)
            return null;
        await this.model.findByIdAndDelete(new mongoose_2.Types.ObjectId(dev.id)).exec();
        return dev;
    }
    async findMany(query) {
        const and = [{ protocolAddress: { $ne: null } }];
        if (query.type)
            and.push({ type: query.type });
        if (query.q) {
            and.push({
                $or: [
                    { protocolAddress: { $regex: query.q, $options: 'i' } },
                    { friendlyName: { $regex: query.q, $options: 'i' } },
                    { model: { $regex: query.q, $options: 'i' } },
                    { manufacturerName: { $regex: query.q, $options: 'i' } },
                ],
            });
        }
        if (query.houseId) {
            and.push({ $or: [{ houseId: query.houseId }, { type: 'Coordinator' }] });
        }
        const filter = { $and: and };
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