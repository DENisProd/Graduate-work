-- Access service: users, houses, RBAC + ABAC.

CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  external_user_id TEXT NOT NULL UNIQUE,
  avatar_url       TEXT,
  created_at       TEXT NOT NULL
);

CREATE TABLE houses (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  avatar_url        TEXT,
  address           TEXT,
  conflict_strategy TEXT NOT NULL DEFAULT 'DENY_OVERRIDES',
  owner_id          TEXT NOT NULL REFERENCES users(id),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  CHECK (conflict_strategy IN ('DENY_OVERRIDES', 'ALLOW_OVERRIDES'))
);

CREATE INDEX idx_houses_owner ON houses(owner_id);

CREATE TABLE house_members (
  id         TEXT PRIMARY KEY,
  house_id   TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  joined_at  TEXT NOT NULL,
  removed_at TEXT,
  UNIQUE (house_id, user_id)
);

CREATE INDEX idx_house_members_user ON house_members(user_id);

CREATE TABLE house_roles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  priority   INTEGER NOT NULL DEFAULT 0,
  is_system  INTEGER NOT NULL DEFAULT 0,
  house_id   TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_house_roles_house ON house_roles(house_id);

CREATE TABLE house_member_roles (
  id              TEXT PRIMARY KEY,
  house_member_id TEXT NOT NULL REFERENCES house_members(id) ON DELETE CASCADE,
  role_id         TEXT NOT NULL REFERENCES house_roles(id)   ON DELETE CASCADE,
  assigned_at     TEXT NOT NULL,
  UNIQUE (house_member_id, role_id)
);

CREATE TABLE resources (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  external_id TEXT,
  path        TEXT NOT NULL,
  depth       INTEGER NOT NULL DEFAULT 0,
  house_id    TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES resources(id) ON DELETE SET NULL,
  CHECK (type IN ('HOUSE', 'ROOM', 'DEVICE', 'DEVICE_FUNCTION'))
);

CREATE INDEX idx_resources_path  ON resources(path);
CREATE INDEX idx_resources_house ON resources(house_id);

CREATE TABLE access_rights (
  id                TEXT PRIMARY KEY,
  access_right_type TEXT NOT NULL,
  parameters        TEXT,
  resource_id       TEXT NOT NULL REFERENCES resources(id)     ON DELETE CASCADE,
  house_member_id   TEXT NOT NULL REFERENCES house_members(id) ON DELETE CASCADE,
  role_id           TEXT REFERENCES house_roles(id) ON DELETE SET NULL,
  granted_by_id     TEXT REFERENCES users(id),
  expires_at        TEXT,
  created_at        TEXT NOT NULL,
  CHECK (access_right_type IN ('ALLOW', 'DENY', 'READ', 'WRITE'))
);

CREATE INDEX idx_access_rights_member   ON access_rights(house_member_id);
CREATE INDEX idx_access_rights_resource ON access_rights(resource_id);

CREATE TABLE access_policies (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  effect       TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id   TEXT,
  condition    TEXT,
  priority     INTEGER NOT NULL DEFAULT 0,
  house_id     TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  resource_id  TEXT REFERENCES resources(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK (effect       IN ('ALLOW', 'DENY')),
  CHECK (subject_type IN ('USER', 'ROLE', 'MEMBER', 'ANYONE'))
);

CREATE INDEX idx_access_policies_house    ON access_policies(house_id);
CREATE INDEX idx_access_policies_resource ON access_policies(resource_id);

CREATE TABLE effective_permissions (
  id                TEXT PRIMARY KEY,
  access_right_type TEXT NOT NULL,
  source_type       TEXT NOT NULL,
  source_id         TEXT NOT NULL,
  house_member_id   TEXT NOT NULL REFERENCES house_members(id) ON DELETE CASCADE,
  resource_id       TEXT NOT NULL REFERENCES resources(id)     ON DELETE CASCADE,
  expires_at        TEXT,
  UNIQUE (house_member_id, resource_id, access_right_type),
  CHECK (source_type IN ('ROLE', 'DIRECT', 'POLICY'))
);

CREATE INDEX idx_eff_perm_member ON effective_permissions(house_member_id);

CREATE TABLE house_invitations (
  id                  TEXT PRIMARY KEY,
  email               TEXT NOT NULL,
  token_hash          TEXT NOT NULL UNIQUE,
  invited_permissions TEXT,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  house_id            TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  role_id             TEXT REFERENCES house_roles(id) ON DELETE SET NULL,
  invited_by_id       TEXT REFERENCES users(id),
  expires_at          TEXT NOT NULL,
  accepted_at         TEXT,
  created_at          TEXT NOT NULL,
  CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'))
);

CREATE TABLE access_audit_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  resource_id TEXT,
  metadata    TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_audit_actor ON access_audit_log(actor_id, created_at DESC);
