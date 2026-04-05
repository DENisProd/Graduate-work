import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { ZigbeeDeviceState } from './zigbee-state.repository';

export type ZigbeeStateRealtimePayload = {
  deviceIeeeAddr: string;
  physicalDeviceId?: string | null;
  friendlyName?: string | null;
  timestamp: Date;
  metrics: {
    state?: string | null;
    brightness?: number | null;
    linkquality?: number | null;
    colorMode?: string | null;
    occupancy?: boolean | null;
    temperature?: number | null;
    humidity?: number | null;
    battery?: number | null;
  };
  payload: Record<string, unknown>;
  stateId: string;
};

@Injectable()
export class ZigbeeRealtimeService {
  private readonly stateSubject = new Subject<ZigbeeStateRealtimePayload>();

  /** Поток обработанных состояний после сохранения в БД (для Socket.IO). */
  readonly stateUpdates$ = this.stateSubject.asObservable();

  publishStateUpdate(
    state: ZigbeeDeviceState,
    meta: {
      physicalDeviceId?: string | null;
      friendlyName?: string | null;
      payload: Record<string, unknown>;
    },
  ): void {
    this.stateSubject.next({
      deviceIeeeAddr: state.deviceIeeeAddr,
      physicalDeviceId: meta.physicalDeviceId ?? null,
      friendlyName: meta.friendlyName ?? null,
      timestamp: state.timestamp,
      metrics: {
        state: state.state ?? null,
        brightness: state.brightness ?? null,
        linkquality: state.linkquality ?? null,
        colorMode: state.colorMode ?? null,
        occupancy: state.occupancy ?? null,
        temperature: state.temperature ?? null,
        humidity: state.humidity ?? null,
        battery: state.battery ?? null,
      },
      payload: meta.payload,
      stateId: state.id,
    });
  }
}
