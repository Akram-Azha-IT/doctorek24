CREATE SCHEMA IF NOT EXISTS annuaire;

CREATE TABLE annuaire.medecin_details (
    user_id     UUID            PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    inpe        VARCHAR(10)     UNIQUE NOT NULL,
    specialite  VARCHAR(100),
    ville       VARCHAR(100),
    adresse     TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    photo_url   TEXT
);

INSERT INTO annuaire.medecin_details (user_id, inpe, specialite, ville, adresse, latitude, longitude, photo_url)
SELECT id, inpe, specialite, ville, adresse, latitude, longitude, photo_url
FROM auth.users
WHERE role = 'MEDECIN' AND inpe IS NOT NULL;

ALTER TABLE auth.users DROP COLUMN IF EXISTS inpe;
ALTER TABLE auth.users DROP COLUMN IF EXISTS specialite;
ALTER TABLE auth.users DROP COLUMN IF EXISTS ville;
ALTER TABLE auth.users DROP COLUMN IF EXISTS adresse;
ALTER TABLE auth.users DROP COLUMN IF EXISTS latitude;
ALTER TABLE auth.users DROP COLUMN IF EXISTS longitude;
ALTER TABLE auth.users DROP COLUMN IF EXISTS photo_url;
