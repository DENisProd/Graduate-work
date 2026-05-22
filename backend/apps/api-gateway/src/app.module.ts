import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthMiddleware } from './auth/auth.middleware';
import { ProxyMiddleware } from './proxy/proxy.middleware';
import { ProxyModule } from './proxy/proxy.module';
import { HealthController } from './health/health.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Module({
  imports: [ProxyModule],
  controllers: [HealthController],
  providers: [
    AuthMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware, ProxyMiddleware)
      // /health is served by HealthController, not proxied
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
