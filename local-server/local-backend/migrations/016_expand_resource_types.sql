-- Expand resource type set (add PAGE, SCENE, GROUP, AUTOMATION) and make
-- access_rights.house_member_id nullable so role-based rights can be stored.
--
-- SQLite does not support ALTER COLUMN or DROP CONSTRAINT, so we recreate
-- both tables that carry the affected constraints.

PRAGMA foreign_keys = OFF;

-- ── resources ──────────────────────────────────────────────────────────────────
CREATE TABLE resources_v2 (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT,
  external_id TEXT,
  path        TEXT NOT NULL,
  depth       INTEGER NOT NULL DEFAULT 0,
  house_id    TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES resources_v2(id) ON DELETE SET NULL,
  CHECK (type IN (
    'HOUSE', 'ROOM', 'DEVICE', 'DEVICE_FUNCTION',
    'PAGE', 'SCENE', 'GROUP', 'AUTOMATION'
  ))
);

INSERT INTO resources_v2 (id, type, name, external_id, path, depth, house_id, parent_id)
SELECT id, type, NULL, external_id, path, depth, house_id, parent_id FROM resources;

DROP TABLE resources;

ALTER TABLE resources_v2 RENAME TO resources;

CREATE INDEX idx_resources_path  ON resources(path);
CREATE INDEX idx_resources_house ON resources(house_id);

-- ── access_rights ──────────────────────────────────────────────────────────────
-- house_member_id is now nullable; at least one of (house_member_id, role_id)
-- must be set (enforced by CHECK).
CREATE TABLE access_rights_v2 (
  id                TEXT PRIMARY KEY,
  access_right_type TEXT NOT NULL,
  parameters        TEXT,
  resource_id       TEXT NOT NULL REFERENCES resources(id)     ON DELETE CASCADE,
  house_member_id   TEXT          REFERENCES house_members(id) ON DELETE CASCADE,
  role_id           TEXT          REFERENCES house_roles(id)   ON DELETE SET NULL,
  granted_by_id     TEXT          REFERENCES users(id),
  expires_at        TEXT,
  created_at        TEXT NOT NULL,
  CHECK (access_right_type IN ('ALLOW', 'DENY', 'READ', 'WRITE')),
  CHECK (house_member_id IS NOT NULL OR role_id IS NOT NULL)
);

INSERT INTO access_rights_v2 SELECT * FROM access_rights;

DROP TABLE access_rights;

ALTER TABLE access_rights_v2 RENAME TO access_rights;

-- ── effective_permissions (depends on access_rights + house_members) ───────────
-- Recreate with correct FK targets after the table renames above.
-- First, preserve existing data.
CREATE TABLE effective_permissions_v2 (
  id                TEXT PRIMARY KEY,
  access_right_type TEXT NOT NULL,
  source_type       TEXT NOT NULL,
  source_id         TEXT NOT NULL,
  house_member_id   TEXT NOT NULL REFERENCES house_members(id) ON DELETE CASCADE,
  resource_id       TEXT NOT NULL REFERENCES resources(id)     ON DELETE CASCADE,
  expires_at        TEXT
);

INSERT INTO effective_permissions_v2 SELECT * FROM effective_permissions;

DROP TABLE effective_permissions;

ALTER TABLE effective_permissions_v2 RENAME TO effective_permissions;

CREATE UNIQUE INDEX IF NOT EXISTS ux_eff_perm
  ON effective_permissions(house_member_id, resource_id, access_right_type);

PRAGMA foreign_keys = ON;

-- ── sync tracking ─────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO sync_versions(entity_type, last_pulled_at, last_pushed_at)
VALUES
  ('roles',         NULL, NULL),
  ('members',       NULL, NULL),
  ('resources',     NULL, NULL),
  ('access_rights', NULL, NULL);
