-- Outbox pattern + bookkeeping for two-way cloud sync.

CREATE TABLE sync_outbox (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  operation   TEXT NOT NULL,
  payload     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  sent_at     TEXT,
  CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_outbox_pending ON sync_outbox(sent_at) WHERE sent_at IS NULL;

CREATE TABLE sync_versions (
  entity_type    TEXT PRIMARY KEY,
  last_pulled_at TEXT,
  last_pushed_at TEXT
);
