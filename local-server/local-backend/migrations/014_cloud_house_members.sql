-- Cloud-synced house member display data (separate from RBAC house_members in 002).
-- No FK constraints — members may arrive before their users are locally known.
CREATE TABLE IF NOT EXISTS cloud_house_members (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    house_id          TEXT NOT NULL,
    user_display_name TEXT,
    user_avatar_url   TEXT,
    joined_at         TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_house_members_house ON cloud_house_members(house_id);
