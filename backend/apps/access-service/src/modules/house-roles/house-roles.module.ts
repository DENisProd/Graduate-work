import { Module, forwardRef } from '@nestjs/common';
import { HouseRolesController } from './house-roles.controller';
import { HouseRolesService } from './house-roles.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';

@Module({
  imports: [PrismaModule, forwardRef(() => HousesModule)],
  controllers: [HouseRolesController],
  providers: [HouseRolesService],
  exports: [HouseRolesService],
})
export class HouseRolesModule {}

