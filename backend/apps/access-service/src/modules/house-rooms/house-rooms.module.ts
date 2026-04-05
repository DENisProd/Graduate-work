import { Module } from '@nestjs/common';
import { HouseRoomsController } from './house-rooms.controller';
import { HouseRoomsService } from './house-rooms.service';
import { HousesModule } from '../houses/houses.module';

@Module({
  imports: [HousesModule],
  controllers: [HouseRoomsController],
  providers: [HouseRoomsService],
  exports: [HouseRoomsService],
})
export class HouseRoomsModule {}
