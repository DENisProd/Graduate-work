-- Scenario service: scenarios, executions, physical devices, device data.

CREATE TABLE physical_devices (
  id                 TEXT PRIMARY KEY,
  name               TEXT,
  description        TEXT,
  house_id           TEXT,
  room_id            TEXT,
  device_id          INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  device_category_id INTEGER REFERENCES device_categories(id) ON DELETE SET NULL,
  protocol_address   TEXT UNIQUE,
  network_address    INTEGER,
  type               TEXT,
  manufacturer_name  TEXT,
  model              TEXT,
  friendly_name      TEXT,
  firmware_version   TEXT,
  last_seen          TEXT,
  definition         TEXT,
  capabilities       TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  CHECK (type IS NULL OR type IN ('Coordinator', 'Router', 'EndDevice'))
);

CREATE INDEX idx_physical_house ON physical_devices(house_id);
CREATE INDEX idx_physical_room  ON physical_devices(room_id);

CREATE TABLE scenarios (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  house_id    TEXT NOT NULL,
  creator_id  TEXT NOT NULL,
  definition  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'OFFLINE',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR'))
);

CREATE INDEX idx_scenarios_house ON scenarios(house_id);

CREATE TABLE scenario_executions (
  id            TEXT PRIMARY KEY,
  scenario_id   TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  triggered_by  TEXT NOT NULL,
  trigger_data  TEXT,
  error_message TEXT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  CHECK (status       IN ('RUNNING', 'SUCCESS', 'FAILURE')),
  CHECK (triggered_by IN ('SCHEDULE', 'MANUAL', 'AUTOMATIC', 'API'))
);

CREATE INDEX idx_exec_scenario ON scenario_executions(scenario_id, started_at DESC);

CREATE TABLE device_data (
  id         TEXT PRIMARY KEY,
  device_id  TEXT NOT NULL REFERENCES physical_devices(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  attribute  TEXT,
  type       TEXT NOT NULL,
  value      TEXT NOT NULL,
  unit       TEXT,
  quality    REAL,
  timestamp  TEXT NOT NULL,
  CHECK (type IN ('FLOAT', 'NUMBER', 'STRING', 'BOOLEAN'))
);

CREATE INDEX idx_device_data_main ON device_data(device_id, capability, timestamp DESC);
CREATE INDEX idx_device_data_ts   ON device_data(device_id, timestamp DESC);
