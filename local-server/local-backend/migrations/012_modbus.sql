CREATE TABLE IF NOT EXISTS modbus_devices (
    id          TEXT    PRIMARY KEY NOT NULL,
    name        TEXT    NOT NULL,
    slave_id    INTEGER NOT NULL,
    description TEXT,
    enabled     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);

-- A "register group" – one addressable chunk of the Modbus address space.
-- For coils / discrete inputs count=1 and scaled_value is 0 or 1.
CREATE TABLE IF NOT EXISTS modbus_registers (
    id              TEXT    PRIMARY KEY NOT NULL,
    device_id       TEXT    NOT NULL REFERENCES modbus_devices(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    register_type   TEXT    NOT NULL CHECK(register_type IN ('holding','input','coil','discrete')),
    address         INTEGER NOT NULL,
    count           INTEGER NOT NULL DEFAULT 1,
    unit            TEXT,
    scale_factor    REAL    NOT NULL DEFAULT 1.0,
    offset          REAL    NOT NULL DEFAULT 0.0,
    writable        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL
);

-- Latest polled values for each register group (one row per register_id).
CREATE TABLE IF NOT EXISTS modbus_states (
    register_id     TEXT PRIMARY KEY NOT NULL REFERENCES modbus_registers(id) ON DELETE CASCADE,
    raw_values      TEXT NOT NULL,  -- JSON array of raw u16 / bool values
    scaled_values   TEXT NOT NULL,  -- JSON array of f64 values after scale+offset
    timestamp       TEXT NOT NULL
);
