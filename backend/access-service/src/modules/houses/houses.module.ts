import { Module, forwardRef } from '@nestjs/common';
import { HousesController } from './houses.controller';
import { HousesAdminController } from './houses.admin.controller';
import { HousesService } from './houses.service';
import { HouseRolesModule } from '../house-roles/house-roles.module';

@Module({
  imports: [forwardRef(() => HouseRolesModule)],
  controllers: [HousesController, HousesAdminController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
