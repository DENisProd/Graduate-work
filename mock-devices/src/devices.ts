export type DeviceType = 'EndDevice' | 'Router';

export interface BridgeDeviceDefinition {
  vendor: string;
  model: string;
  description: string;
}

export interface MockDevice {
  ieeeAddr: string;
  friendlyName: string;
  type: DeviceType;
  manufacturer: string;
  modelId: string;
  definition: BridgeDeviceDefinition;
  /** Whether this device accepts /set commands */
  controllable: boolean;
  /** Mutable runtime state (updated by commands and simulation tick) */
  state: Record<string, unknown>;
  /** Returns the next sensor payload to publish */
  tick(): Record<string, unknown>;
  /** Applies an incoming /set command payload to state */
  applyCommand(payload: Record<string, unknown>): void;
}

function rnd(min: number, max: number, decimals = 1): number {
  const v = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(v * factor) / factor;
}

function linkquality(): number {
  return Math.floor(rnd(100, 255, 0));
}

// ─────────────────────────────────────────────────────────────
// 1. Temperature + Humidity sensor (read-only)
// ─────────────────────────────────────────────────────────────
export const tempSensorLivingRoom: MockDevice = {
  ieeeAddr: '0x0000000000000001',
  friendlyName: 'temp_sensor_living_room',
  type: 'EndDevice',
  manufacturer: 'Xiaomi',
  modelId: 'WSDCGQ11LM',
  definition: {
    vendor: 'Xiaomi',
    model: 'WSDCGQ11LM',
    description: 'Temperature and humidity sensor',
  },
  controllable: false,
  state: { battery: 95 },

  tick() {
    this.state = {
      ...this.state,
      temperature: rnd(18.0, 26.0),
      humidity: rnd(35.0, 65.0),
      battery: rnd(80, 100, 0),
      linkquality: linkquality(),
    };
    return { ...this.state };
  },

  applyCommand() {
    // read-only device — ignore
  },
};

// ─────────────────────────────────────────────────────────────
// 2. Motion / occupancy sensor (read-only)
// ─────────────────────────────────────────────────────────────
export const motionSensorHallway: MockDevice = {
  ieeeAddr: '0x0000000000000002',
  friendlyName: 'motion_sensor_hallway',
  type: 'EndDevice',
  manufacturer: 'Philips',
  modelId: 'SML001',
  definition: {
    vendor: 'Philips',
    model: 'SML001',
    description: 'Hue motion sensor',
  },
  controllable: false,
  state: { battery: 90, occupancy: false },

  tick() {
    // occupancy triggers ~30 % of ticks
    this.state = {
      ...this.state,
      occupancy: Math.random() < 0.3,
      battery: rnd(70, 100, 0),
      linkquality: linkquality(),
    };
    return { ...this.state };
  },

  applyCommand() {
    // read-only device — ignore
  },
};

// ─────────────────────────────────────────────────────────────
// 3. Smart light bulb (controllable)
// ─────────────────────────────────────────────────────────────
export const smartLightBedroom: MockDevice = {
  ieeeAddr: '0x0000000000000003',
  friendlyName: 'smart_light_bedroom',
  type: 'Router',
  manufacturer: 'IKEA',
  modelId: 'LED1623G12',
  definition: {
    vendor: 'IKEA',
    model: 'LED1623G12',
    description: 'TRADFRI LED bulb E27 1000 lumen, dimmable, white spectrum',
  },
  controllable: true,
  state: { state: 'OFF', brightness: 128, color_mode: 'ct' },

  tick() {
    this.state = {
      ...this.state,
      linkquality: linkquality(),
    };
    return { ...this.state };
  },

  applyCommand(payload) {
    if (payload.state !== undefined) this.state.state = payload.state;
    if (payload.brightness !== undefined) {
      this.state.brightness = Math.max(0, Math.min(255, Number(payload.brightness)));
      if (this.state.brightness === 0) this.state.state = 'OFF';
    }
    if (payload.color_mode !== undefined) this.state.color_mode = payload.color_mode;
    if (payload.color_temp !== undefined) this.state.color_temp = payload.color_temp;
  },
};

// ─────────────────────────────────────────────────────────────
// 4. Smart plug / switch (controllable + power meter)
// ─────────────────────────────────────────────────────────────
export const smartPlugKitchen: MockDevice = {
  ieeeAddr: '0x0000000000000004',
  friendlyName: 'smart_plug_kitchen',
  type: 'Router',
  manufacturer: 'SONOFF',
  modelId: 'S26R2ZB',
  definition: {
    vendor: 'SONOFF',
    model: 'S26R2ZB',
    description: 'Zigbee smart plug',
  },
  controllable: true,
  state: { state: 'OFF', power: 0, energy: 0, current: 0, voltage: 230 },

  tick() {
    const on = this.state.state === 'ON';
    this.state = {
      ...this.state,
      power: on ? rnd(800, 1800) : 0,
      current: on ? rnd(3.5, 8.0) : 0,
      voltage: rnd(228, 232),
      linkquality: linkquality(),
    };
    return { ...this.state };
  },

  applyCommand(payload) {
    if (payload.state !== undefined) {
      this.state.state = payload.state;
      if (this.state.state === 'OFF') {
        this.state.power = 0;
        this.state.current = 0;
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 5. Door / window contact sensor (read-only)
// ─────────────────────────────────────────────────────────────
export const contactSensorFrontDoor: MockDevice = {
  ieeeAddr: '0x0000000000000005',
  friendlyName: 'contact_sensor_front_door',
  type: 'EndDevice',
  manufacturer: 'Aqara',
  modelId: 'MCCGQ11LM',
  definition: {
    vendor: 'Aqara',
    model: 'MCCGQ11LM',
    description: 'Door and window sensor',
  },
  controllable: false,
  state: { contact: true, battery: 85 },

  tick() {
    // door opens ~20 % of ticks
    this.state = {
      ...this.state,
      contact: Math.random() > 0.2,
      battery: rnd(70, 100, 0),
      linkquality: linkquality(),
    };
    return { ...this.state };
  },

  applyCommand() {
    // read-only device — ignore
  },
};

export const ALL_DEVICES: MockDevice[] = [
  tempSensorLivingRoom,
  motionSensorHallway,
  smartLightBedroom,
  smartPlugKitchen,
  contactSensorFrontDoor,
];
