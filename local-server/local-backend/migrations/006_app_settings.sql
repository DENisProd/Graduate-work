-- Runtime key/value settings persisted by local-server.
-- Used for mutable network/auth configuration changed from the frontend.

CREATE TABLE app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL
);
