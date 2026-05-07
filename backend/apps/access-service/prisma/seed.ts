/**
 * Seed: Device Catalog
 *
 * Запуск: pnpm run seed  (из apps/access-service/)
 *         или ts-node prisma/seed.ts
 *
 * Идемпотентно — все операции через upsert/connectOrCreate.
 * Безопасно запускать повторно.
 */

import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: join(__dirname, '../../../.env') });

const url = process.env.ACCESS_CONTROL_DB_URL;
if (!url) throw new Error('ACCESS_CONTROL_DB_URL is not set');

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// ─── helpers ────────────────────────────────────────────────────────────────

function tr(ru: string, en: string, description?: string) {
  return [
    { locale: 'ru', name: ru, description: description ?? null },
    { locale: 'en', name: en, description: description ?? null },
  ];
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const DEVICE_TYPES = [
  { code: 'lighting',    names: tr('Освещение',       'Lighting') },
  { code: 'climate',     names: tr('Климат',          'Climate') },
  { code: 'security',    names: tr('Безопасность',    'Security') },
  { code: 'energy',      names: tr('Энергетика',      'Energy') },
  { code: 'sensors',     names: tr('Датчики',         'Sensors') },
  { code: 'multimedia',  names: tr('Мультимедиа',     'Multimedia') },
];

// categoryCode → typeCode
const DEVICE_CATEGORIES = [
  // Освещение
  { code: 'smart_bulb',       typeCode: 'lighting',   names: tr('Умная лампочка',           'Smart Bulb') },
  { code: 'smart_switch',     typeCode: 'lighting',   names: tr('Умный выключатель',        'Smart Switch') },
  { code: 'led_strip',        typeCode: 'lighting',   names: tr('Светодиодная лента',       'LED Strip') },
  { code: 'floor_lamp',       typeCode: 'lighting',   names: tr('Напольный светильник',     'Floor Lamp') },
  // Климат
  { code: 'thermostat',       typeCode: 'climate',    names: tr('Термостат',                'Thermostat') },
  { code: 'air_conditioner',  typeCode: 'climate',    names: tr('Кондиционер',              'Air Conditioner') },
  { code: 'fan',              typeCode: 'climate',    names: tr('Вентилятор',               'Fan') },
  { code: 'humidifier',       typeCode: 'climate',    names: tr('Увлажнитель',              'Humidifier') },
  // Безопасность
  { code: 'door_lock',        typeCode: 'security',   names: tr('Умный замок',              'Smart Lock') },
  { code: 'motion_sensor',    typeCode: 'security',   names: tr('Датчик движения',          'Motion Sensor') },
  { code: 'door_sensor',      typeCode: 'security',   names: tr('Датчик двери / окна',      'Door/Window Sensor') },
  { code: 'camera',           typeCode: 'security',   names: tr('IP-камера',                'IP Camera') },
  // Энергетика
  { code: 'smart_plug',       typeCode: 'energy',     names: tr('Умная розетка',            'Smart Plug') },
  { code: 'energy_meter',     typeCode: 'energy',     names: tr('Счётчик энергии',          'Energy Meter') },
  { code: 'power_strip',      typeCode: 'energy',     names: tr('Управляемый удлинитель',   'Smart Power Strip') },
  // Датчики
  { code: 'temp_sensor',      typeCode: 'sensors',    names: tr('Датчик температуры',       'Temperature Sensor') },
  { code: 'co2_sensor',       typeCode: 'sensors',    names: tr('Датчик CO₂',               'CO2 Sensor') },
  { code: 'smoke_detector',   typeCode: 'sensors',    names: tr('Датчик дыма',              'Smoke Detector') },
  // Мультимедиа
  { code: 'smart_speaker',    typeCode: 'multimedia', names: tr('Умная колонка',            'Smart Speaker') },
  { code: 'media_player',     typeCode: 'multimedia', names: tr('Медиаплеер',               'Media Player') },
];

// ─── Devices with functions and actions ─────────────────────────────────────

interface ActionDef {
  code: string;
  actionType: 'TOGGLE' | 'COMMAND' | 'VALUE';
  payloadTemplate?: string;
  names: ReturnType<typeof tr>;
}

interface FunctionDef {
  code: string;
  functionType: 'READ' | 'WRITE' | 'READ_WRITE';
  unit?: string;
  minValue?: number;
  maxValue?: number;
  names: ReturnType<typeof tr>;
  actions?: ActionDef[];
}

interface DeviceDef {
  code: string;
  categoryCode: string;
  serialNumber?: string;
  firmwareVersion?: string;
  names: ReturnType<typeof tr>;
  functions: FunctionDef[];
}

const DEVICES: DeviceDef[] = [
  // ── 1. Philips Hue Color A19 ──────────────────────────────────────────────
  {
    code: 'philips_hue_color_a19',
    categoryCode: 'smart_bulb',
    serialNumber: 'PHI-HUE-CA19-001',
    firmwareVersion: '1.104.2',
    names: tr('Philips Hue Color A19', 'Philips Hue Color A19'),
    functions: [
      {
        code: 'power',
        functionType: 'READ_WRITE',
        names: tr('Питание', 'Power'),
        actions: [
          { code: 'toggle', actionType: 'TOGGLE', payloadTemplate: '{}',             names: tr('Переключить', 'Toggle') },
          { code: 'turn_on',  actionType: 'COMMAND', payloadTemplate: '{"state":"ON"}',  names: tr('Включить', 'Turn On') },
          { code: 'turn_off', actionType: 'COMMAND', payloadTemplate: '{"state":"OFF"}', names: tr('Выключить', 'Turn Off') },
        ],
      },
      {
        code: 'brightness',
        functionType: 'READ_WRITE',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Яркость', 'Brightness'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"brightness":{{value}}}', names: tr('Установить яркость', 'Set Brightness') },
        ],
      },
      {
        code: 'color_temp',
        functionType: 'READ_WRITE',
        unit: 'K',
        minValue: 2000,
        maxValue: 6500,
        names: tr('Цветовая температура', 'Color Temperature'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"color_temp":{{value}}}', names: tr('Установить температуру', 'Set Color Temp') },
        ],
      },
      {
        code: 'color_xy',
        functionType: 'READ_WRITE',
        names: tr('Цвет (XY)', 'Color (XY)'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"color":{"x":{{x}},"y":{{y}}}}', names: tr('Установить цвет', 'Set Color') },
        ],
      },
    ],
  },

  // ── 2. IKEA TRADFRI E27 ───────────────────────────────────────────────────
  {
    code: 'ikea_tradfri_bulb_e27',
    categoryCode: 'smart_bulb',
    serialNumber: 'IKEA-TRF-E27-002',
    firmwareVersion: '2.3.089',
    names: tr('IKEA TRADFRI E27', 'IKEA TRADFRI E27'),
    functions: [
      {
        code: 'power',
        functionType: 'READ_WRITE',
        names: tr('Питание', 'Power'),
        actions: [
          { code: 'toggle',   actionType: 'TOGGLE',  payloadTemplate: '{}',              names: tr('Переключить', 'Toggle') },
          { code: 'turn_on',  actionType: 'COMMAND', payloadTemplate: '{"state":"ON"}',  names: tr('Включить', 'Turn On') },
          { code: 'turn_off', actionType: 'COMMAND', payloadTemplate: '{"state":"OFF"}', names: tr('Выключить', 'Turn Off') },
        ],
      },
      {
        code: 'brightness',
        functionType: 'READ_WRITE',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Яркость', 'Brightness'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"brightness":{{value}}}', names: tr('Установить яркость', 'Set Brightness') },
        ],
      },
      {
        code: 'color_temp',
        functionType: 'READ_WRITE',
        unit: 'K',
        minValue: 2700,
        maxValue: 4000,
        names: tr('Цветовая температура', 'Color Temperature'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"color_temp":{{value}}}', names: tr('Установить температуру', 'Set Color Temp') },
        ],
      },
    ],
  },

  // ── 3. Xiaomi Aqara Temperature & Humidity Sensor ────────────────────────
  {
    code: 'xiaomi_aqara_temp_hum',
    categoryCode: 'temp_sensor',
    serialNumber: 'XIAO-AQ-TH-003',
    firmwareVersion: '3.2.4',
    names: tr('Xiaomi Aqara Датчик температуры и влажности', 'Xiaomi Aqara Temperature & Humidity'),
    functions: [
      {
        code: 'temperature',
        functionType: 'READ',
        unit: '°C',
        minValue: -40,
        maxValue: 85,
        names: tr('Температура', 'Temperature'),
      },
      {
        code: 'humidity',
        functionType: 'READ',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Влажность', 'Humidity'),
      },
      {
        code: 'pressure',
        functionType: 'READ',
        unit: 'hPa',
        minValue: 300,
        maxValue: 1100,
        names: tr('Атмосферное давление', 'Atmospheric Pressure'),
      },
      {
        code: 'battery',
        functionType: 'READ',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Заряд батареи', 'Battery Level'),
      },
    ],
  },

  // ── 4. Sonoff Mini R2 ─────────────────────────────────────────────────────
  {
    code: 'sonoff_mini_r2',
    categoryCode: 'smart_switch',
    serialNumber: 'SONF-MNR2-004',
    firmwareVersion: '4.1.0',
    names: tr('Sonoff Mini R2', 'Sonoff Mini R2'),
    functions: [
      {
        code: 'power',
        functionType: 'READ_WRITE',
        names: tr('Питание', 'Power'),
        actions: [
          { code: 'toggle',   actionType: 'TOGGLE',  payloadTemplate: '{}',              names: tr('Переключить', 'Toggle') },
          { code: 'turn_on',  actionType: 'COMMAND', payloadTemplate: '{"state":"ON"}',  names: tr('Включить', 'Turn On') },
          { code: 'turn_off', actionType: 'COMMAND', payloadTemplate: '{"state":"OFF"}', names: tr('Выключить', 'Turn Off') },
        ],
      },
    ],
  },

  // ── 5. Tuya Smart Plug ────────────────────────────────────────────────────
  {
    code: 'tuya_smart_plug_16a',
    categoryCode: 'smart_plug',
    serialNumber: 'TUYA-SP16-005',
    firmwareVersion: '1.0.8',
    names: tr('Tuya Smart Plug 16A', 'Tuya Smart Plug 16A'),
    functions: [
      {
        code: 'power',
        functionType: 'READ_WRITE',
        names: tr('Питание', 'Power'),
        actions: [
          { code: 'toggle',   actionType: 'TOGGLE',  payloadTemplate: '{}',              names: tr('Переключить', 'Toggle') },
          { code: 'turn_on',  actionType: 'COMMAND', payloadTemplate: '{"state":"ON"}',  names: tr('Включить', 'Turn On') },
          { code: 'turn_off', actionType: 'COMMAND', payloadTemplate: '{"state":"OFF"}', names: tr('Выключить', 'Turn Off') },
        ],
      },
      {
        code: 'current_power',
        functionType: 'READ',
        unit: 'W',
        minValue: 0,
        maxValue: 3680,
        names: tr('Мощность', 'Current Power'),
      },
      {
        code: 'voltage',
        functionType: 'READ',
        unit: 'V',
        minValue: 0,
        maxValue: 250,
        names: tr('Напряжение', 'Voltage'),
      },
      {
        code: 'current',
        functionType: 'READ',
        unit: 'A',
        minValue: 0,
        maxValue: 16,
        names: tr('Сила тока', 'Current'),
      },
    ],
  },

  // ── 6. Xiaomi Aqara Door Sensor ───────────────────────────────────────────
  {
    code: 'xiaomi_aqara_door_sensor',
    categoryCode: 'door_sensor',
    serialNumber: 'XIAO-AQ-DS-006',
    firmwareVersion: '3.1.2',
    names: tr('Xiaomi Aqara Датчик двери', 'Xiaomi Aqara Door Sensor'),
    functions: [
      {
        code: 'contact',
        functionType: 'READ',
        names: tr('Состояние контакта', 'Contact State'),
      },
      {
        code: 'battery',
        functionType: 'READ',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Заряд батареи', 'Battery Level'),
      },
    ],
  },

  // ── 7. Google Nest Thermostat E ───────────────────────────────────────────
  {
    code: 'google_nest_thermostat_e',
    categoryCode: 'thermostat',
    serialNumber: 'GOOG-NST-TE-007',
    firmwareVersion: '6.2.0',
    names: tr('Google Nest Thermostat E', 'Google Nest Thermostat E'),
    functions: [
      {
        code: 'current_temp',
        functionType: 'READ',
        unit: '°C',
        minValue: -10,
        maxValue: 50,
        names: tr('Текущая температура', 'Current Temperature'),
      },
      {
        code: 'target_temp',
        functionType: 'READ_WRITE',
        unit: '°C',
        minValue: 5,
        maxValue: 35,
        names: tr('Целевая температура', 'Target Temperature'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"target_temp":{{value}}}', names: tr('Установить температуру', 'Set Temperature') },
        ],
      },
      {
        code: 'heating',
        functionType: 'READ',
        names: tr('Нагрев активен', 'Heating Active'),
      },
      {
        code: 'mode',
        functionType: 'READ_WRITE',
        names: tr('Режим работы', 'Operating Mode'),
        actions: [
          { code: 'set_auto', actionType: 'COMMAND', payloadTemplate: '{"mode":"auto"}', names: tr('Авто', 'Auto') },
          { code: 'set_heat', actionType: 'COMMAND', payloadTemplate: '{"mode":"heat"}', names: tr('Нагрев', 'Heat') },
          { code: 'set_cool', actionType: 'COMMAND', payloadTemplate: '{"mode":"cool"}', names: tr('Охлаждение', 'Cool') },
          { code: 'set_off',  actionType: 'COMMAND', payloadTemplate: '{"mode":"off"}',  names: tr('Выключить', 'Off') },
        ],
      },
    ],
  },

  // ── 8. Yeelight LED Strip Pro ─────────────────────────────────────────────
  {
    code: 'yeelight_led_strip_pro',
    categoryCode: 'led_strip',
    serialNumber: 'YEEL-LSP-008',
    firmwareVersion: '2.0.6_0056',
    names: tr('Yeelight LED Strip Pro', 'Yeelight LED Strip Pro'),
    functions: [
      {
        code: 'power',
        functionType: 'READ_WRITE',
        names: tr('Питание', 'Power'),
        actions: [
          { code: 'toggle',   actionType: 'TOGGLE',  payloadTemplate: '{}',              names: tr('Переключить', 'Toggle') },
          { code: 'turn_on',  actionType: 'COMMAND', payloadTemplate: '{"state":"ON"}',  names: tr('Включить', 'Turn On') },
          { code: 'turn_off', actionType: 'COMMAND', payloadTemplate: '{"state":"OFF"}', names: tr('Выключить', 'Turn Off') },
        ],
      },
      {
        code: 'brightness',
        functionType: 'READ_WRITE',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Яркость', 'Brightness'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"brightness":{{value}}}', names: tr('Установить яркость', 'Set Brightness') },
        ],
      },
      {
        code: 'color_rgb',
        functionType: 'READ_WRITE',
        names: tr('Цвет (RGB)', 'Color (RGB)'),
        actions: [
          { code: 'set_value', actionType: 'VALUE', payloadTemplate: '{"color":{"r":{{r}},"g":{{g}},"b":{{b}}}}', names: tr('Установить цвет', 'Set Color') },
        ],
      },
      {
        code: 'effect',
        functionType: 'WRITE',
        names: tr('Световой эффект', 'Light Effect'),
        actions: [
          { code: 'rainbow',  actionType: 'COMMAND', payloadTemplate: '{"effect":"rainbow"}',  names: tr('Радуга', 'Rainbow') },
          { code: 'blink',    actionType: 'COMMAND', payloadTemplate: '{"effect":"blink"}',    names: tr('Мигание', 'Blink') },
          { code: 'breathe',  actionType: 'COMMAND', payloadTemplate: '{"effect":"breathe"}',  names: tr('Дыхание', 'Breathe') },
        ],
      },
    ],
  },

  // ── 9. Xiaomi Mi Motion Sensor ────────────────────────────────────────────
  {
    code: 'xiaomi_mi_motion_sensor',
    categoryCode: 'motion_sensor',
    serialNumber: 'XIAO-MI-MS-009',
    firmwareVersion: '1.4.1_0043',
    names: tr('Xiaomi Mi Датчик движения', 'Xiaomi Mi Motion Sensor'),
    functions: [
      {
        code: 'occupancy',
        functionType: 'READ',
        names: tr('Обнаружено движение', 'Motion Detected'),
      },
      {
        code: 'illuminance',
        functionType: 'READ',
        unit: 'lux',
        minValue: 0,
        maxValue: 83000,
        names: tr('Освещённость', 'Illuminance'),
      },
      {
        code: 'battery',
        functionType: 'READ',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Заряд батареи', 'Battery Level'),
      },
    ],
  },

  // ── 10. Zigbee CO2 Sensor (generic) ──────────────────────────────────────
  {
    code: 'zigbee_co2_sensor_generic',
    categoryCode: 'co2_sensor',
    serialNumber: 'ZB-CO2-010',
    firmwareVersion: '1.0.2',
    names: tr('Zigbee Датчик CO₂ (универсальный)', 'Zigbee CO2 Sensor (generic)'),
    functions: [
      {
        code: 'co2',
        functionType: 'READ',
        unit: 'ppm',
        minValue: 0,
        maxValue: 5000,
        names: tr('Концентрация CO₂', 'CO2 Concentration'),
      },
      {
        code: 'temperature',
        functionType: 'READ',
        unit: '°C',
        minValue: -10,
        maxValue: 60,
        names: tr('Температура', 'Temperature'),
      },
      {
        code: 'humidity',
        functionType: 'READ',
        unit: '%',
        minValue: 0,
        maxValue: 100,
        names: tr('Влажность', 'Humidity'),
      },
    ],
  },
];

// ─── SEED ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding device catalog...\n');

  // 1. Device Types
  console.log('→ Device types');
  const typeIdByCode: Record<string, number> = {};
  for (const dt of DEVICE_TYPES) {
    const record = await prisma.deviceType.upsert({
      where: { code: dt.code },
      update: {},
      create: {
        code: dt.code,
        translations: {
          createMany: {
            data: dt.names.map(({ locale, name, description }) => ({ locale, name, description })),
            skipDuplicates: true,
          },
        },
      },
    });
    typeIdByCode[dt.code] = record.id;
    console.log(`   ✔ ${dt.code} (id=${record.id})`);
  }

  // 2. Device Categories
  console.log('\n→ Device categories');
  const catIdByCode: Record<string, number> = {};
  for (const dc of DEVICE_CATEGORIES) {
    const record = await prisma.deviceCategory.upsert({
      where: { code: dc.code },
      update: {},
      create: {
        code: dc.code,
        deviceTypeId: typeIdByCode[dc.typeCode],
        translations: {
          createMany: {
            data: dc.names.map(({ locale, name, description }) => ({ locale, name, description })),
            skipDuplicates: true,
          },
        },
      },
    });
    catIdByCode[dc.code] = record.id;
    console.log(`   ✔ ${dc.code} (id=${record.id})`);
  }

  // 3. Devices + Functions + Actions
  console.log('\n→ Devices');
  for (const dev of DEVICES) {
    const deviceRecord = await prisma.device.upsert({
      where: { code: dev.code },
      update: {},
      create: {
        code: dev.code,
        deviceCategoryId: catIdByCode[dev.categoryCode],
        serialNumber: dev.serialNumber ?? null,
        firmwareVersion: dev.firmwareVersion ?? null,
        translations: {
          createMany: {
            data: dev.names.map(({ locale, name, description }) => ({ locale, name, description })),
            skipDuplicates: true,
          },
        },
      },
    });
    console.log(`   ✔ ${dev.code} (id=${deviceRecord.id})`);

    for (const fn of dev.functions) {
      const fnRecord = await prisma.deviceFunction.upsert({
        where: { deviceId_code: { deviceId: deviceRecord.id, code: fn.code } },
        update: {},
        create: {
          code: fn.code,
          deviceId: deviceRecord.id,
          functionType: fn.functionType,
          unit: fn.unit ?? null,
          minValue: fn.minValue ?? null,
          maxValue: fn.maxValue ?? null,
          translations: {
            createMany: {
              data: fn.names.map(({ locale, name, description }) => ({ locale, name, description })),
              skipDuplicates: true,
            },
          },
        },
      });

      for (const action of fn.actions ?? []) {
        await prisma.deviceFunctionAction.upsert({
          where: { deviceFunctionId_code: { deviceFunctionId: fnRecord.id, code: action.code } },
          update: {},
          create: {
            code: action.code,
            deviceFunctionId: fnRecord.id,
            actionType: action.actionType,
            payloadTemplate: action.payloadTemplate ?? null,
            translations: {
              createMany: {
                data: action.names.map(({ locale, name, description }) => ({ locale, name, description })),
                skipDuplicates: true,
              },
            },
          },
        });
      }
    }
  }

  console.log('\n✅ Done!');
  console.log(`   Types:      ${DEVICE_TYPES.length}`);
  console.log(`   Categories: ${DEVICE_CATEGORIES.length}`);
  console.log(`   Devices:    ${DEVICES.length}`);
  const totalFns = DEVICES.reduce((s, d) => s + d.functions.length, 0);
  const totalActs = DEVICES.reduce((s, d) => s + d.functions.reduce((ss, f) => ss + (f.actions?.length ?? 0), 0), 0);
  console.log(`   Functions:  ${totalFns}`);
  console.log(`   Actions:    ${totalActs}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
