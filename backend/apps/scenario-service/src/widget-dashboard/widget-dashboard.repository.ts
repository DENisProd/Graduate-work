import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types, type Model } from 'mongoose';
import {
  WIDGET_DASHBOARD_MODEL,
  type WidgetDashboardDocument,
  type WidgetDashboardModel,
} from '../mongo/schemas/widget-dashboard.mongo';

type Doc = WidgetDashboardModel & { _id: Types.ObjectId };
type Dashboard = WidgetDashboardModel & { id: string };

@Injectable()
export class WidgetDashboardRepository {
  constructor(
    @InjectModel(WIDGET_DASHBOARD_MODEL)
    private readonly model: Model<WidgetDashboardModel>,
  ) {}

  private map(doc: WidgetDashboardDocument): Dashboard {
    const { _id, ...rest } = doc.toObject<Doc>();
    return { ...rest, id: _id.toHexString() };
  }

  async create(
    data: Omit<WidgetDashboardModel, 'createdAt' | 'updatedAt'>,
  ): Promise<Dashboard> {
    const now = new Date();
    const doc = await this.model.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return this.map(doc);
  }

  async findById(id: string): Promise<Dashboard | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? this.map(doc) : null;
  }

  async findByHouse(houseId: string): Promise<Dashboard[]> {
    const docs = await this.model
      .find({ houseId })
      .sort({ isDefault: -1, createdAt: 1 })
      .exec();
    return docs.map((d) => this.map(d));
  }

  async update(
    id: string,
    data: Partial<
      Pick<WidgetDashboardModel, 'name' | 'isDefault' | 'layouts' | 'widgets'>
    >,
  ): Promise<Dashboard> {
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { ...data, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!updated) throw new Error(`WidgetDashboard ${id} not found`);
    return this.map(updated);
  }

  async delete(id: string): Promise<Dashboard> {
    const deleted = await this.model.findByIdAndDelete(id).exec();
    if (!deleted) throw new Error(`WidgetDashboard ${id} not found`);
    return this.map(deleted);
  }

  async clearDefault(houseId: string, userId: string): Promise<void> {
    await this.model
      .updateMany(
        { houseId, userId, isDefault: true },
        { $set: { isDefault: false } },
      )
      .exec();
  }
}
