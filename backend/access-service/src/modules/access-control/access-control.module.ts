import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import { HousesModule } from '../houses/houses.module';
import { HouseMembersModule } from '../house-members/house-members.module';
import { HouseRoomsModule } from '../house-rooms/house-rooms.module';
import { HouseRolesModule } from '../house-roles/house-roles.module';

@Module({
  imports: [HousesModule, HouseMembersModule, HouseRoomsModule, HouseRolesModule],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
