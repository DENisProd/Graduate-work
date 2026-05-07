import type { DeviceStateEvent } from '../zigbee/zigbee.service';
import { TriggerSourceType } from '../common/schemas/enums';

export type { DeviceStateEvent };

export interface TriggerContext {
  type: 'SCHEDULE' | 'MANUAL' | 'DEVICE_EVENT' | 'WEBHOOK';
  initiatorId?: string;
  deviceEvent?: DeviceStateEvent;
  webhookToken?: string;
  webhookPayload?: Record<string, unknown>;
}

export function triggerContextToSource(
  ctx: TriggerContext,
): TriggerSourceType {
  switch (ctx.type) {
    case 'SCHEDULE':
      return TriggerSourceType.SCHEDULE;
    case 'MANUAL':
      return TriggerSourceType.MANUAL;
    case 'DEVICE_EVENT':
      return TriggerSourceType.AUTOMATIC;
    case 'WEBHOOK':
      return TriggerSourceType.API;
  }
}
