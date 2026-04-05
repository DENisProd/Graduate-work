import { Module } from '@nestjs/common';
import { HouseInvitationsController } from './house-invitations.controller';
import { HouseInvitationsService } from './house-invitations.service';
import { HousesModule } from '../houses/houses.module';
import { HouseMembersModule } from '../house-members/house-members.module';
import { HouseRolesModule } from '../house-roles/house-roles.module';

@Module({
  imports: [HousesModule, HouseMembersModule, HouseRolesModule],
  controllers: [HouseInvitationsController],
  providers: [HouseInvitationsService],
  exports: [HouseInvitationsService],
})
export class HouseInvitationsModule {}
