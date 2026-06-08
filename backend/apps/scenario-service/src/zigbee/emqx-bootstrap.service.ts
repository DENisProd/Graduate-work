import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmqxProvisionService } from './emqx-provision.service';

@Injectable()
export class EmqxBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(EmqxBootstrapService.name);
  private ready: Promise<void> = Promise.resolve();

  constructor(
    private readonly config: ConfigService,
    private readonly emqx: EmqxProvisionService,
  ) {}

  onModuleInit(): void {
    this.ready = this.bootstrap();
  }

  waitReady(): Promise<void> {
    return this.ready;
  }

  private async bootstrap(): Promise<void> {
    const username = this.config.get<string>('CENTRAL_MQTT_USERNAME')?.trim();
    const password = this.config.get<string>('CENTRAL_MQTT_PASSWORD')?.trim();
    if (!username || !password) {
      this.logger.warn(
        'CENTRAL_MQTT_USERNAME/PASSWORD not set — skipping EMQX user bootstrap',
      );
      return;
    }

    try {
      await this.emqx.ensureScenarioServiceUser(username, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `EMQX user bootstrap failed (MQTT will retry): ${message}`,
      );
    }
  }
}
