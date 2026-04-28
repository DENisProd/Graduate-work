-- Zigbee service: device states, logs, network topology links.

CREATE TABLE zigbee_device_states (
  id               TEXT PRIMARY KEY,
  device_ieee_addr TEXT NOT NULL,
  timestamp        TEXT NOT NULL,
  payload          TEXT NOT NULL,
  state            TEXT,
  brightness       INTEGER,
  linkquality      INTEGER,
  color_mode       TEXT,
  occupancy        INTEGER,
  temperature      REAL,
  humidity         REAL,
  battery          REAL,
  CHECK (occupancy IS NULL OR occupancy IN (0, 1))
);

CREATE INDEX idx_zds_ieee_ts ON zigbee_device_states(device_ieee_addr, timestamp DESC);

CREATE TABLE zigbee_device_logs (
  id                 TEXT PRIMARY KEY,
  device_ieee_addr   TEXT NOT NULL,
  physical_device_id TEXT REFERENCES physical_devices(id) ON DELETE SET NULL,
  timestamp          TEXT NOT NULL,
  source             TEXT NOT NULL,
  kind               TEXT NOT NULL,
  message            TEXT,
  metrics            TEXT,
  payload_keys       TEXT,
  state_document_id  TEXT,
  metadata           TEXT,
  CHECK (source IN ('mqtt', 'api'))
);

CREATE INDEX idx_zdl_ieee_ts ON zigbee_device_logs(device_ieee_addr, timestamp DESC);
CREATE INDEX idx_zdl_phys_ts ON zigbee_device_logs(physical_device_id, timestamp DESC);

CREATE TABLE device_network_links (
  id               TEXT PRIMARY KEY,
  source_device_id TEXT NOT NULL REFERENCES physical_devices(id) ON DELETE CASCADE,
  target_device_id TEXT NOT NULL REFERENCES physical_devices(id) ON DELETE CASCADE,
  protocol         TEXT NOT NULL DEFAULT 'Zigbee',
  link_quality     INTEGER,
  rssi             REAL,
  lqi              INTEGER,
  metadata         TEXT,
  collected_at     TEXT NOT NULL,
  UNIQUE (source_device_id, target_device_id, protocol)
);

CREATE INDEX idx_dnl_source ON device_network_links(source_device_id);
CREATE INDEX idx_dnl_target ON device_network_links(target_device_id);
