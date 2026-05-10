-- Seed default admin user
INSERT INTO auth.users (id, email, phone, password, first_name, last_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@doctorek.ma',
  NULL,
  'admin123',
  'Super',
  'Admin',
  'ADMIN',
  true
)
ON CONFLICT (email) DO NOTHING;
