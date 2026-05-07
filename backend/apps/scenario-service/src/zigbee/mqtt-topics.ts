/**
 * Canonical MQTT topic helpers for the scenario-service.
 *
 * All topic strings MUST be built through these functions — never hand-write
 * `"houses/..."` literals anywhere else in the backend codebase.
 *
 * Topic scheme reference: docs/mqtt-topic-scheme.md
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const HOUSE_PREFIX = 'houses';
export const CMD_SEGMENT = 'cmd';

// ---------------------------------------------------------------------------
// Builder functions
// ---------------------------------------------------------------------------

/**
 * Returns the Zigbee2MQTT data prefix for a specific house.
 *
 * @example
 * houseDataPrefix('h1') // => "houses/h1/zigbee2mqtt"
 */
export function houseDataPrefix(houseId: string): string {
  return `${HOUSE_PREFIX}/${houseId}/zigbee2mqtt`;
}

/**
 * Returns the wildcard subscription pattern that covers all Zigbee2MQTT
 * telemetry from a given house.
 *
 * Subscribe with QoS 1, retained = false.
 *
 * @example
 * telemetryWildcard('h1') // => "houses/h1/zigbee2mqtt/#"
 */
export function telemetryWildcard(houseId: string): string {
  return `${houseDataPrefix(houseId)}/#`;
}

/**
 * Returns the retained status topic for a house.
 *
 * Publish with QoS 1, retained = true.
 *
 * @example
 * statusTopic('h1') // => "houses/h1/status"
 */
export function statusTopic(houseId: string): string {
  return `${HOUSE_PREFIX}/${houseId}/status`;
}

/**
 * Returns a command topic under `houses/{houseId}/cmd/zigbee2mqtt/{suffix}`.
 *
 * Used to send commands to the local Zigbee2MQTT instance through the
 * central MQTT broker. Publish with QoS 1, retained = false.
 *
 * @example
 * buildCmdTopic('h1', 'living-room-lamp/set')
 * // => "houses/h1/cmd/zigbee2mqtt/living-room-lamp/set"
 *
 * buildCmdTopic('h1', 'bridge/request/permit_join')
 * // => "houses/h1/cmd/zigbee2mqtt/bridge/request/permit_join"
 */
export function buildCmdTopic(houseId: string, suffix: string): string {
  return `${HOUSE_PREFIX}/${houseId}/${CMD_SEGMENT}/zigbee2mqtt/${suffix}`;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the house-id segment from any `houses/{houseId}/...` topic.
 *
 * Returns `null` if the topic does not start with the expected prefix or if
 * the house-id segment is missing or empty.
 *
 * @example
 * parseHouseId('houses/h1/zigbee2mqtt/bridge/event') // => "h1"
 * parseHouseId('unrelated/topic')                    // => null
 */
export function parseHouseId(topic: string): string | null {
  const prefix = `${HOUSE_PREFIX}/`;
  if (!topic.startsWith(prefix)) return null;
  const rest = topic.slice(prefix.length);
  const slash = rest.indexOf('/');
  if (slash === -1) return null;
  const houseId = rest.slice(0, slash);
  return houseId || null;
}

/**
 * Extracts the Zigbee2MQTT suffix from a telemetry topic for a known house.
 *
 * Returns `null` if the topic does not match the expected pattern for the
 * given houseId.
 *
 * @example
 * extractZ2mSuffix('h1', 'houses/h1/zigbee2mqtt/bridge/event')
 * // => "bridge/event"
 */
export function extractZ2mSuffix(houseId: string, topic: string): string | null {
  const prefix = `${houseDataPrefix(houseId)}/`;
  if (!topic.startsWith(prefix)) return null;
  return topic.slice(prefix.length);
}
