import { z } from 'zod';
import { deviceDataTypeSchema } from '../../common/schemas/enums';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export const createDeviceDataSchema = z.object({
  deviceId: z.string().min(1),
  capability: z.string().min(1).max(128),
  attribute: z.string().min(1).max(128).optional(),
  type: deviceDataTypeSchema,
  value: z.unknown(),
  unit: z.string().max(50).optional(),
  quality: z.coerce.number().optional(),
  timestamp: z.coerce.date().optional(),
});
export type CreateDeviceDataInput = z.infer<typeof createDeviceDataSchema>;

export const deviceDataSeriesRangeSchema = z.enum(['1m', '1h', '6h', '24h', '7d']);
export type DeviceDataSeriesRange = z.infer<typeof deviceDataSeriesRangeSchema>;

const listDeviceDataQuerySchemaBase = z.object({
  deviceId: z.string().optional(),
  capability: z.string().optional(),
  attribute: z.string().optional(),
  type: deviceDataTypeSchema.optional(),
  // Some clients (and occasionally proxies) may pass percent-encoded ISO strings
  // e.g. `2026-05-08T11%3A25%3A14.879Z`. Be defensive and decode before coercing.
  from: z
    .preprocess((v) => {
      if (typeof v !== 'string') return v;
      try {
        const once = decodeURIComponent(v);
        // In case of double-encoding (`%253A` -> `%3A` -> `:`)
        return once.includes('%') ? decodeURIComponent(once) : once;
      } catch {
        return v;
      }
    }, z.coerce.date())
    .optional(),
  to: z
    .preprocess((v) => {
      if (typeof v !== 'string') return v;
      try {
        const once = decodeURIComponent(v);
        return once.includes('%') ? decodeURIComponent(once) : once;
      } catch {
        return v;
      }
    }, z.coerce.date())
    .optional(),
});
export const listDeviceDataQuerySchema = listDeviceDataQuerySchemaBase.merge(
  paginationQuerySchema,
);
export type ListDeviceDataQuery = z.infer<typeof listDeviceDataQuerySchema>;

export const deviceDataSeriesQuerySchema = z.object({
  deviceId: z.string().min(1),
  range: deviceDataSeriesRangeSchema,
  /**
   * CSV list of capabilities, e.g. `battery,occupancy,zigbee`.
   * If omitted, backend will return all capabilities present in the time window.
   */
  capabilities: z.string().optional(),
  /**
   * Anchor end timestamp (ISO). Defaults to now.
   * Used for incremental loading: call again with `to=<previous from>` to extend history backwards.
   */
  to: z
    .preprocess((v) => {
      if (typeof v !== 'string') return v;
      try {
        const once = decodeURIComponent(v);
        return once.includes('%') ? decodeURIComponent(once) : once;
      } catch {
        return v;
      }
    }, z.coerce.date())
    .optional(),
});
export type DeviceDataSeriesQuery = z.infer<typeof deviceDataSeriesQuerySchema>;
