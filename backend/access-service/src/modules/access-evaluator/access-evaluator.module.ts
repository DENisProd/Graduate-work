import { Module } from '@nestjs/common';
import { AccessEvaluatorService } from './access-evaluator.service';
import { AccessEvaluatorController } from './access-evaluator.controller';
import { ResourcesModule } from '../resources/resources.module';
import { UsersModule } from '../users/users.module';
import { HouseMembersModule } from 'src/modules/house-members/house-members.module';

@Module({
  imports: [ResourcesModule, UsersModule, HouseMembersModule],
  controllers: [AccessEvaluatorController],
  providers: [AccessEvaluatorService],
})
export class AccessEvaluatorModule {}

