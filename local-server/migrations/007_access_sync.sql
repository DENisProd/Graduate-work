-- Add human-readable name to resources (rooms, devices).
-- Also seed sync_versions rows for entity types we pull from access-service.

ALTER TABLE resources ADD COLUMN name TEXT;

INSERT OR IGNORE INTO sync_versions(entity_type, last_pulled_at, last_pushed_at)
VALUES
  ('houses', NULL, NULL),
  ('rooms',  NULL, NULL);
