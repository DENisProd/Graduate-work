import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const WIDGET_DASHBOARD_MODEL = 'WidgetDashboard';

@Schema({ collection: 'WidgetDashboard' })
export class WidgetDashboardModel {
  @Prop({ required: true }) houseId: string;
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) name: string;
  @Prop({ default: false }) isDefault: boolean;
  @Prop({ type: Object, default: {} }) layouts: Record<string, unknown>;
  @Prop({ type: Array, default: [] }) widgets: unknown[];
  @Prop({ required: true }) createdAt: Date;
  @Prop({ required: true }) updatedAt: Date;
}

export type WidgetDashboardDocument = HydratedDocument<WidgetDashboardModel>;
export const WidgetDashboardSchema =
  SchemaFactory.createForClass(WidgetDashboardModel);
