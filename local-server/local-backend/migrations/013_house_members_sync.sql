-- House members pulled from access-service cloud
CREATE TABLE IF NOT EXISTS house_members (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    house_id          TEXT NOT NULL,
    user_display_name TEXT,
    user_avatar_url   TEXT,
    joined_at         TEXT NOT NULL,
    updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_house_members_house ON house_members(house_id);
