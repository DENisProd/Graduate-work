import { Module } from '@nestjs/common';
import { GATEWAY_CONFIG } from '../config/gateway.config';
import { ProxyService } from './proxy.service';

@Module({
  providers: [
    {
      provide: GATEWAY_CONFIG,
      useFactory: () => {
        const { loadGatewayConfig } = require('../config/gateway.config');
        return loadGatewayConfig();
      },
    },
    ProxyService,
  ],
  exports: [GATEWAY_CONFIG, ProxyService],
})
export class ProxyModule {}
