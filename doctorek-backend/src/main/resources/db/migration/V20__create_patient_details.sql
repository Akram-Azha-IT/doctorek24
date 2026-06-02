-- ============================================================
-- V20 : Patient profile separation
--   1. Create patient schema + patient_details table (parallel to annuaire.medecin_details)
--   2. Backfill identity / contact fields from carte.cartes_virtuelles
--   3. Drop migrated columns from carte.cartes_virtuelles (carte = health card only)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS patient;

CREATE TABLE patient.patient_details (
    user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    date_naissance DATE,
    genre          VARCHAR(20),
    nationalite    VARCHAR(100),
    num_identite   TEXT,
    photo_url      TEXT,
    telephone      VARCHAR(30),
    adresse_rue    TEXT,
    adresse_ville  VARCHAR(100),
    adresse_pays   VARCHAR(100),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_patient_genre CHECK (genre IS NULL OR genre IN ('HOMME','FEMME','AUTRE'))
);

CREATE INDEX IF NOT EXISTS idx_patient_details_ville
    ON patient.patient_details(adresse_ville);

-- ---------- Backfill from cartes_virtuelles ----------
-- Any row in carte.cartes_virtuelles already has patient_id (UNIQUE), so the
-- backfill below is 1-to-1 per existing carte. Patients without a carte simply
-- get no row (their entry will be created when they fill their profile).
INSERT INTO patient.patient_details (
    user_id, date_naissance, genre, nationalite, num_identite,
    photo_url, telephone, adresse_rue, adresse_ville, adresse_pays,
    created_at, updated_at
)
SELECT
    patient_id,
    date_naissance,
    genre,
    nationalite,
    num_identite,
    photo_url,
    telephone,
    adresse_rue,
    adresse_ville,
    adresse_pays,
    COALESCE(created_at, NOW()),
    COALESCE(updated_at, NOW())
FROM carte.cartes_virtuelles
ON CONFLICT (user_id) DO NOTHING;

-- ---------- Drop migrated columns from cartes_virtuelles ----------
ALTER TABLE carte.cartes_virtuelles
    DROP COLUMN IF EXISTS date_naissance,
    DROP COLUMN IF EXISTS genre,
    DROP COLUMN IF EXISTS nationalite,
    DROP COLUMN IF EXISTS num_identite,
    DROP COLUMN IF EXISTS photo_url,
    DROP COLUMN IF EXISTS telephone,
    DROP COLUMN IF EXISTS adresse_rue,
    DROP COLUMN IF EXISTS adresse_ville,
    DROP COLUMN IF EXISTS adresse_pays;

-- chk_carte_genre from V19 referenced the (now-removed) genre column — drop it
ALTER TABLE carte.cartes_virtuelles
    DROP CONSTRAINT IF EXISTS chk_carte_genre;

-- updated_at trigger on the new table (function defined in V19)
DROP TRIGGER IF EXISTS trg_patient_details_updated_at ON patient.patient_details;
CREATE TRIGGER trg_patient_details_updated_at
    BEFORE UPDATE ON patient.patient_details
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
