import { buildCmdTopic, resolveZigbeeCommandTopic } from './mqtt-topics';

describe('resolveZigbeeCommandTopic', () => {
  const houseId = 'house-uuid-1';

  it('uses cmd path on central broker', () => {
    expect(
      resolveZigbeeCommandTopic(
        houseId,
        `houses/${houseId}/zigbee2mqtt`,
        'bridge/request/permit_join',
        true,
      ),
    ).toBe(buildCmdTopic(houseId, 'bridge/request/permit_join'));
  });

  it('uses topic prefix on direct local broker', () => {
    expect(
      resolveZigbeeCommandTopic(
        houseId,
        'zigbee2mqtt',
        'bridge/request/permit_join',
        false,
      ),
    ).toBe('zigbee2mqtt/bridge/request/permit_join');
  });
});
