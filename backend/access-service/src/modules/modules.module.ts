import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ResourcesModule } from './resources/resources.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PoliciesModule } from './policies/policies.module';
import { AuditModule } from './audit/audit.module';
import { AccessEvaluatorModule } from './access-evaluator/access-evaluator.module';
import { HousesModule } from 'src/modules/houses/houses.module';
import { HouseMembersModule } from 'src/modules/house-members/house-members.module';

@Module({
  imports: [
    UsersModule,
    HousesModule,
    HouseMembersModule,
    ResourcesModule,
    PermissionsModule,
    PoliciesModule,
    AuditModule,
    AccessEvaluatorModule,
  ],
})
export class ModulesModule {}

