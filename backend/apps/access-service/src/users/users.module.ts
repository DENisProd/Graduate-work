import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserService } from './users.service';
import { SyncUserDisplayNameInterceptor } from './sync-user-display-name.interceptor';

@Global()
@Module({
  providers: [
    UserService,
    { provide: APP_INTERCEPTOR, useClass: SyncUserDisplayNameInterceptor },
  ],
  exports: [UserService],
})
export class UsersModule {}
