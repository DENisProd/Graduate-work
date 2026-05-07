import { Injectable, NotFoundException } from '@nestjs/common';
import { WidgetDashboardRepository } from './widget-dashboard.repository';

@Injectable()
export class WidgetDashboardService {
  constructor(private readonly repo: WidgetDashboardRepository) {}

  async create(data: {
    houseId: string;
    userId: string;
    name: string;
    isDefault?: boolean;
    layouts?: Record<string, unknown>;
    widgets?: unknown[];
  }) {
    if (data.isDefault) {
      await this.repo.clearDefault(data.houseId, data.userId);
    }
    return this.repo.create({
      houseId: data.houseId,
      userId: data.userId,
      name: data.name,
      isDefault: data.isDefault ?? false,
      layouts: data.layouts ?? {},
      widgets: data.widgets ?? [],
    });
  }

  async findByHouse(houseId: string) {
    return this.repo.findByHouse(houseId);
  }

  async findById(id: string) {
    const dash = await this.repo.findById(id);
    if (!dash) throw new NotFoundException(`WidgetDashboard ${id} not found`);
    return dash;
  }

  async update(
    id: string,
    data: {
      name?: string;
      isDefault?: boolean;
      layouts?: Record<string, unknown>;
      widgets?: unknown[];
    },
  ) {
    await this.findById(id);
    if (data.isDefault) {
      const dash = await this.repo.findById(id);
      if (dash) await this.repo.clearDefault(dash.houseId, dash.userId);
    }
    return this.repo.update(id, data);
  }

  async updateLayout(id: string, layouts: Record<string, unknown>) {
    await this.findById(id);
    return this.repo.update(id, { layouts });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repo.delete(id);
  }
}
