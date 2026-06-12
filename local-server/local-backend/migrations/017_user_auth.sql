-- Local password authentication for offline login.
-- Users are pulled from the cloud on sync; each is issued the shared default
-- password "0000". The cloud linker (the user who paired this server) is forced
-- to change it on first login. Hash format: sha256$<salt_hex>$<digest_hex>.
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
