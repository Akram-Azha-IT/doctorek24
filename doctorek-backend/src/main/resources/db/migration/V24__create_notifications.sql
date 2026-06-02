CREATE SCHEMA IF NOT EXISTS notif;

CREATE TABLE notif.notification (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    data        JSONB,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_created ON notif.notification(user_id, created_at DESC);
CREATE INDEX idx_notif_unread       ON notif.notification(user_id) WHERE read_at IS NULL;
