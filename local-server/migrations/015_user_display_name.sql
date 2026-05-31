-- Add human-readable display name to users, populated from cloud sync.
ALTER TABLE users ADD COLUMN display_name TEXT;
