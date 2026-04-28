import { Module } from '@nestjs/common';
import { AccessServiceClient } from './access-service.client';
import { AccessSyncService } from './access-sync.service';

@Module({
  providers: [AccessServiceClient, AccessSyncService],
  exports: [AccessSyncService],
})
export class AccessSyncModule {}
