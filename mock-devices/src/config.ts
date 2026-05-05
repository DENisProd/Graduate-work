import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  mqttUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
  topicPrefix: process.env.ZIGBEE_MQTT_TOPIC_PREFIX ?? 'zigbee2mqtt',
  publishIntervalMs: parseInt(process.env.PUBLISH_INTERVAL_MS ?? '30000', 10),
};
