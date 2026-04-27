ALTER TABLE auth.users
    ADD COLUMN latitude  DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

COMMENT ON COLUMN auth.users.latitude  IS 'WGS-84 latitude of doctor cabinet';
COMMENT ON COLUMN auth.users.longitude IS 'WGS-84 longitude of doctor cabinet';
