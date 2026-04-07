-- ============================================================
-- V3 : Champs spécifiques aux médecins
-- ============================================================
ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS inpe       VARCHAR(10)  UNIQUE,
    ADD COLUMN IF NOT EXISTS specialite VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ville      VARCHAR(100),
    ADD COLUMN IF NOT EXISTS adresse    TEXT;

CREATE INDEX IF NOT EXISTS idx_users_inpe ON auth.users(inpe);
