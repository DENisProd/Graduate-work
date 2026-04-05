import { Module, Global } from '@nestjs/common';
import { UserService } from './users.service';

@Global()
@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
