ALTER TABLE auth.users
    ADD COLUMN email_verified              BOOLEAN     NOT NULL DEFAULT false,
    ADD COLUMN verification_code           VARCHAR(6),
    ADD COLUMN verification_code_expires_at TIMESTAMPTZ;
