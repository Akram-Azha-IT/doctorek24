-- ============================================================
-- V2 : Table des utilisateurs (module auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    phone       VARCHAR(20)  UNIQUE,
    password    VARCHAR(255) NOT NULL,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'PATIENT',
    lang        VARCHAR(5)   NOT NULL DEFAULT 'fr',
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON auth.users(phone);
