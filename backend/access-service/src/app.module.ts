import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { ModulesModule } from './modules/modules.module';
import { UsersModule as AccessUsersModule } from './users/users.module';
import { HousesModule } from './modules/houses/houses.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { HouseMembersModule } from './modules/house-members/house-members.module';
import { HouseRoomsModule } from './modules/house-rooms/house-rooms.module';
import { HouseInvitationsModule } from './modules/house-invitations/house-invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../.env'),
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    PrismaModule,
    AccessUsersModule,
    HealthModule,
    HousesModule,
    HouseMembersModule,
    HouseRoomsModule,
    HouseInvitationsModule,
    AccessControlModule,
    ModulesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

