-- Keycloak identity bridge: store Keycloak user UUID alongside our profile
ALTER TABLE auth.users
    ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(36) UNIQUE;
