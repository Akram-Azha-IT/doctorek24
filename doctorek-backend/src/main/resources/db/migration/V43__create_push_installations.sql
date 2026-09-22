CREATE TABLE notif.push_installation (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    installation_id   UUID NOT NULL UNIQUE,
    platform          VARCHAR(16) NOT NULL CHECK (platform IN ('ANDROID', 'IOS')),
    environment       VARCHAR(16) NOT NULL CHECK (environment IN ('DEVELOPMENT', 'PRODUCTION')),
    token_hash        VARCHAR(64) NOT NULL UNIQUE,
    token_ciphertext  TEXT NOT NULL,
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_installation_user_enabled
    ON notif.push_installation(user_id) WHERE enabled = TRUE;
