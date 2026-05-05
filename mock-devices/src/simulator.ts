import * as mqtt from 'mqtt';
import { config } from './config';
import { ALL_DEVICES, MockDevice } from './devices';

const prefix = config.topicPrefix;

function bridgeTopic(sub: string): string {
  return `${prefix}/bridge/${sub}`;
}

function deviceTopic(friendlyName: string): string {
  return `${prefix}/${friendlyName}`;
}

function setTopic(friendlyName: string): string {
  return `${prefix}/${friendlyName}/set`;
}

// ── Bridge "devices" retained message ──────────────────────────────────────
function buildBridgeDevicesPayload(): string {
  const list = ALL_DEVICES.map((d) => ({
    ieee_address: d.ieeeAddr,
    friendly_name: d.friendlyName,
    type: d.type,
    manufacturer: d.manufacturer,
    model_id: d.modelId,
    definition: d.definition,
    supported: true,
    interview_completed: true,
  }));
  return JSON.stringify(list);
}

// ── Send a device_announce event for one device ────────────────────────────
function publishAnnounce(client: mqtt.MqttClient, device: MockDevice): void {
  const event = {
    type: 'device_announce',
    data: {
      ieee_address: device.ieeeAddr,
      friendly_name: device.friendlyName,
      definition: device.definition,
      manufacturer: device.manufacturer,
      model_id: device.modelId,
      supported: true,
    },
  };
  client.publish(bridgeTopic('event'), JSON.stringify(event));
}

// ── Publish a state reading for one device ─────────────────────────────────
function publishState(client: mqtt.MqttClient, device: MockDevice): void {
  const payload = device.tick();
  client.publish(deviceTopic(device.friendlyName), JSON.stringify(payload));
  console.log(`[${device.friendlyName}] →`, payload);
}

// ── Subscribe to /set topics for controllable devices ─────────────────────
function subscribeControllable(client: mqtt.MqttClient): void {
  const controllable = ALL_DEVICES.filter((d) => d.controllable);
  for (const device of controllable) {
    const topic = setTopic(device.friendlyName);
    client.subscribe(topic, (err) => {
      if (!err) console.log(`[simulator] subscribed to ${topic}`);
    });
  }
}

// ── Handle incoming /set commands ─────────────────────────────────────────
function handleMessage(
  client: mqtt.MqttClient,
  topic: string,
  message: Buffer,
): void {
  const deviceName = topic.replace(`${prefix}/`, '').replace('/set', '');
  const device = ALL_DEVICES.find((d) => d.friendlyName === deviceName);
  if (!device) return;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(message.toString()) as Record<string, unknown>;
  } catch {
    console.warn(`[${deviceName}] invalid JSON in /set: ${message.toString()}`);
    return;
  }

  console.log(`[${deviceName}] ← SET`, payload);
  device.applyCommand(payload);

  // Immediately echo back the new state so the backend sees the update
  const newState = device.tick();
  client.publish(deviceTopic(device.friendlyName), JSON.stringify(newState));
  console.log(`[${deviceName}] → (after set)`, newState);
}

// ── Main entry ─────────────────────────────────────────────────────────────
export function startSimulator(): void {
  console.log(`[simulator] connecting to ${config.mqttUrl} …`);
  const client = mqtt.connect(config.mqttUrl);

  client.on('connect', () => {
    console.log('[simulator] connected');

    // 1. Publish bridge state (online)
    client.publish(
      bridgeTopic('state'),
      JSON.stringify({ state: 'online' }),
      { retain: true },
    );

    // 2. Publish retained device list
    client.publish(bridgeTopic('devices'), buildBridgeDevicesPayload(), {
      retain: true,
    });

    // 3. Announce each device
    for (const device of ALL_DEVICES) {
      publishAnnounce(client, device);
    }

    // 4. Publish first reading for every device immediately
    for (const device of ALL_DEVICES) {
      publishState(client, device);
    }

    // 5. Subscribe to /set topics for controllable devices
    subscribeControllable(client);

    // 6. Schedule periodic readings
    setInterval(() => {
      for (const device of ALL_DEVICES) {
        publishState(client, device);
      }
    }, config.publishIntervalMs);

    console.log(
      `[simulator] publishing every ${config.publishIntervalMs / 1000}s`,
    );
  });

  client.on('message', (topic, message) => {
    handleMessage(client, topic, message);
  });

  client.on('error', (err) => {
    console.error('[simulator] MQTT error:', err.message);
  });

  client.on('offline', () => {
    console.warn('[simulator] MQTT offline, reconnecting …');
  });
}
