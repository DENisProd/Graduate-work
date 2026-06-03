import { normalizeZigbeePayload } from './normalize-zigbee-payload';

describe('normalizeZigbeePayload', () => {
  it('extracts realtime state fields from mixed Zigbee payload formats', () => {
    const normalized = normalizeZigbeePayload({
      state: 'ON',
      brightness: '254',
      linkquality: 78.9,
      color_mode: 'xy',
      occupancy: 'true',
      temperature: '23.4',
      humidity: '48',
      battery: '92',
    });

    expect(normalized).toEqual({
      state: 'ON',
      brightness: 254,
      linkquality: 78,
      colorMode: 'xy',
      occupancy: true,
      temperature: 23.4,
      humidity: 48,
      battery: 92,
    });
  });

  it('supports fallback fields used by different device models', () => {
    const normalized = normalizeZigbeePayload({
      colorMode: 'hs',
      motion: 'off',
      local_temperature: 21.5,
    });

    expect(normalized).toEqual({
      colorMode: 'hs',
      occupancy: false,
      temperature: 21.5,
    });
  });

  it('ignores invalid telemetry values instead of producing broken state', () => {
    const normalized = normalizeZigbeePayload({
      brightness: 'not-a-number',
      occupancy: 'maybe',
      humidity: null,
      battery: Number.NaN,
    });

    expect(normalized).toEqual({});
  });
});
