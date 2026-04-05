import { Module } from '@nestjs/common';
import { HouseMembersController } from './house-members.controller';
import { HouseMembersService } from './house-members.service';
import { HousesModule } from '../houses/houses.module';
import { HouseRolesModule } from '../house-roles/house-roles.module';

@Module({
  imports: [HousesModule, HouseRolesModule],
  controllers: [HouseMembersController],
  providers: [HouseMembersService],
  exports: [HouseMembersService],
})
export class HouseMembersModule {}
