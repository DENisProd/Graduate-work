import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { ResourcesModule } from '../resources/resources.module';
import { UsersModule } from '../users/users.module';
import { HouseRolesModule } from 'src/modules/house-roles/house-roles.module';
import { HouseMembersModule } from 'src/modules/house-members/house-members.module';

@Module({
  imports: [ResourcesModule, HouseMembersModule, HouseRolesModule, UsersModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}

