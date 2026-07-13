-- Profile picture URL (e.g. from a social identity provider like Google).
-- Nullable: most accounts fall back to a generated initials avatar.
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);
