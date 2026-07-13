-- Security hardening: V13 seeded the admin with a plaintext password.
-- Authentication is handled by Keycloak — the local password column is never
-- used for login, so neutralize the known plaintext value.
UPDATE auth.users
SET password = '!keycloak-managed'
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND password = 'admin123';
