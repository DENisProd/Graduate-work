import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WidgetDashboardController } from './widget-dashboard.controller';
import { WidgetDashboardService } from './widget-dashboard.service';
import { WidgetDashboardRepository } from './widget-dashboard.repository';
import {
  WIDGET_DASHBOARD_MODEL,
  WidgetDashboardSchema,
} from '../mongo/schemas/widget-dashboard.mongo';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WIDGET_DASHBOARD_MODEL, schema: WidgetDashboardSchema },
    ]),
  ],
  controllers: [WidgetDashboardController],
  providers: [WidgetDashboardService, WidgetDashboardRepository],
})
export class WidgetDashboardModule {}
