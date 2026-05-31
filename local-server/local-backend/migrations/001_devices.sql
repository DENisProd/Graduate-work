-- Device service: catalog tables (translation tables follow the same shape).

CREATE TABLE device_types (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE device_categories (
  id             INTEGER PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  device_type_id INTEGER NOT NULL REFERENCES device_types(id),
  active         INTEGER NOT NULL DEFAULT 1,
  is_moderated   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_device_categories_type ON device_categories(device_type_id);

CREATE TABLE devices (
  id                 INTEGER PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  device_category_id INTEGER NOT NULL REFERENCES device_categories(id),
  status             TEXT NOT NULL DEFAULT 'OFFLINE',
  serial_number      TEXT,
  firmware_version   TEXT,
  active             INTEGER NOT NULL DEFAULT 1,
  is_moderated       INTEGER NOT NULL DEFAULT 0,
  last_seen_at       TEXT,
  CHECK (status IN ('ONLINE', 'OFFLINE'))
);

CREATE INDEX idx_devices_category ON devices(device_category_id);
CREATE INDEX idx_devices_status   ON devices(status);

CREATE TABLE device_functions (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL,
  device_id     INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  function_type TEXT NOT NULL,
  current_value TEXT,
  min_value     TEXT,
  max_value     TEXT,
  unit          TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  UNIQUE (device_id, code),
  CHECK (function_type IN ('READ', 'WRITE', 'READ_WRITE'))
);

CREATE TABLE device_function_actions (
  id                  INTEGER PRIMARY KEY,
  code                TEXT NOT NULL,
  device_function_id  INTEGER NOT NULL REFERENCES device_functions(id) ON DELETE CASCADE,
  action_type         TEXT NOT NULL,
  payload_template    TEXT,
  active              INTEGER NOT NULL DEFAULT 1,
  UNIQUE (device_function_id, code),
  CHECK (action_type IN ('TOGGLE', 'COMMAND', 'VALUE'))
);

CREATE TABLE device_translations (
  id          INTEGER PRIMARY KEY,
  device_id   INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  locale      TEXT NOT NULL,
  name        TEXT,
  description TEXT,
  UNIQUE (device_id, locale)
);

CREATE TABLE device_type_translations (
  id             INTEGER PRIMARY KEY,
  device_type_id INTEGER NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  locale         TEXT NOT NULL,
  name           TEXT,
  description    TEXT,
  UNIQUE (device_type_id, locale)
);

CREATE TABLE device_category_translations (
  id                 INTEGER PRIMARY KEY,
  device_category_id INTEGER NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
  locale             TEXT NOT NULL,
  name               TEXT,
  description        TEXT,
  UNIQUE (device_category_id, locale)
);

CREATE TABLE device_function_translations (
  id                 INTEGER PRIMARY KEY,
  device_function_id INTEGER NOT NULL REFERENCES device_functions(id) ON DELETE CASCADE,
  locale             TEXT NOT NULL,
  name               TEXT,
  description        TEXT,
  UNIQUE (device_function_id, locale)
);

CREATE TABLE device_function_action_translations (
  id                        INTEGER PRIMARY KEY,
  device_function_action_id INTEGER NOT NULL REFERENCES device_function_actions(id) ON DELETE CASCADE,
  locale                    TEXT NOT NULL,
  name                      TEXT,
  description               TEXT,
  UNIQUE (device_function_action_id, locale)
);
