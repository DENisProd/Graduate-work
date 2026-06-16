import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HouseFloorPlanController } from './house-floor-plan.controller';
import { HouseFloorPlanService } from './house-floor-plan.service';
import { HouseFloorPlanRepository } from './house-floor-plan.repository';
import {
  HOUSE_FLOOR_PLAN_MODEL,
  HouseFloorPlanSchema,
} from '../mongo/schemas/house-floor-plan.mongo';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HOUSE_FLOOR_PLAN_MODEL, schema: HouseFloorPlanSchema },
    ]),
  ],
  controllers: [HouseFloorPlanController],
  providers: [HouseFloorPlanService, HouseFloorPlanRepository],
})
export class HouseFloorPlanModule {}
