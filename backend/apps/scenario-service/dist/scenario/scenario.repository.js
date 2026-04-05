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
exports.ScenarioRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const pagination_1 = require("../common/schemas/pagination");
const scenario_mongo_1 = require("../mongo/schemas/scenario.mongo");
let ScenarioRepository = class ScenarioRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    map(doc) {
        const { _id, ...rest } = doc.toObject();
        return { ...rest, id: _id.toHexString() };
    }
    async create(data) {
        const now = new Date();
        const doc = await this.model.create({
            ...data,
            createdAt: now,
            updatedAt: now,
        });
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
        if (params.houseId)
            filter.houseId = params.houseId;
        if (params.creatorId)
            filter.creatorId = params.creatorId;
        if (params.status)
            filter.status = params.status;
        const { skip, take } = (0, pagination_1.skipTake)({ page: params.page, limit: params.limit });
        const [items, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items: items.map((item) => this.map(item)), total };
    }
    async update(id, data) {
        if (!(0, mongoose_2.isValidObjectId)(id)) {
            throw new Error('Invalid ObjectId');
        }
        const updated = await this.model
            .findByIdAndUpdate(id, { $set: { ...data, updatedAt: new Date() } }, { new: true })
            .exec();
        if (!updated) {
            throw new Error('Scenario not found');
        }
        return this.map(updated);
    }
    async delete(id) {
        if (!(0, mongoose_2.isValidObjectId)(id)) {
            throw new Error('Invalid ObjectId');
        }
        const deleted = await this.model.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new Error('Scenario not found');
        }
        return this.map(deleted);
    }
};
exports.ScenarioRepository = ScenarioRepository;
exports.ScenarioRepository = ScenarioRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(scenario_mongo_1.SCENARIO_MODEL)),
    __metadata("design:paramtypes", [Function])
], ScenarioRepository);
//# sourceMappingURL=scenario.repository.js.map