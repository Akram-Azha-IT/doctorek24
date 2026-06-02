-- ============================================================
-- V19 : Schema hardening
--   1. CHECK constraints on enum-like VARCHAR columns
--   2. JSONB conversions for structured data
--   3. Missing FK indexes
--   4. Search indexes (trigram + composite)
--   5. Geo composite index
--   6. updated_at trigger function
--   7. audit_log enrichment (old_value / new_value)
-- ============================================================

-- ============================================================
-- 1. CHECK constraints
-- ============================================================

-- auth.users.role
ALTER TABLE auth.users
    DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE auth.users
    ADD CONSTRAINT chk_users_role
    CHECK (role IN ('PATIENT', 'MEDECIN', 'ADMIN'));

-- agenda.rendez_vous.statut
ALTER TABLE agenda.rendez_vous
    DROP CONSTRAINT IF EXISTS chk_rdv_statut;
ALTER TABLE agenda.rendez_vous
    ADD CONSTRAINT chk_rdv_statut
    CHECK (statut IN ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE'));

ALTER TABLE agenda.rendez_vous
    DROP CONSTRAINT IF EXISTS chk_rdv_duree;
ALTER TABLE agenda.rendez_vous
    ADD CONSTRAINT chk_rdv_duree CHECK (duree > 0 AND duree <= 240);

-- agenda.disponibilites enums
-- jour_semaine uses DayOfWeek.name() values (English uppercase)
ALTER TABLE agenda.disponibilites
    DROP CONSTRAINT IF EXISTS chk_dispo_jour;
ALTER TABLE agenda.disponibilites
    ADD CONSTRAINT chk_dispo_jour
    CHECK (jour_semaine IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'));

ALTER TABLE agenda.disponibilites
    DROP CONSTRAINT IF EXISTS chk_dispo_frequence;
ALTER TABLE agenda.disponibilites
    ADD CONSTRAINT chk_dispo_frequence
    CHECK (frequence IN ('UNE_SEULE_FOIS', 'TOUTES_LES_SEMAINES', 'PERSONNALISE'));

ALTER TABLE agenda.disponibilites
    DROP CONSTRAINT IF EXISTS chk_dispo_type_fin;
ALTER TABLE agenda.disponibilites
    ADD CONSTRAINT chk_dispo_type_fin
    CHECK (type_fin IN ('JAMAIS', 'DATE'));

ALTER TABLE agenda.disponibilites
    DROP CONSTRAINT IF EXISTS chk_dispo_horaires;
ALTER TABLE agenda.disponibilites
    ADD CONSTRAINT chk_dispo_horaires CHECK (heure_fin > heure_debut);

ALTER TABLE agenda.disponibilites
    DROP CONSTRAINT IF EXISTS chk_dispo_duree;
ALTER TABLE agenda.disponibilites
    ADD CONSTRAINT chk_dispo_duree
    CHECK (duree_consultation > 0 AND duree_consultation <= 240);

-- carte.cartes_virtuelles.statut
ALTER TABLE carte.cartes_virtuelles
    DROP CONSTRAINT IF EXISTS chk_carte_statut;
ALTER TABLE carte.cartes_virtuelles
    ADD CONSTRAINT chk_carte_statut
    CHECK (statut IN ('VIRTUEL', 'EMIS', 'BLOQUE', 'EXPIRE'));

ALTER TABLE carte.cartes_virtuelles
    DROP CONSTRAINT IF EXISTS chk_carte_genre;
ALTER TABLE carte.cartes_virtuelles
    ADD CONSTRAINT chk_carte_genre
    CHECK (genre IS NULL OR genre IN ('HOMME', 'FEMME', 'AUTRE'));

-- ============================================================
-- 2. JSONB conversions
-- ============================================================

-- dossier.ordonnances.medicaments (JSON-in-TEXT → JSONB)
ALTER TABLE dossier.ordonnances
    ALTER COLUMN medicaments DROP DEFAULT;
ALTER TABLE dossier.ordonnances
    ALTER COLUMN medicaments TYPE jsonb
    USING CASE
        WHEN medicaments IS NULL OR medicaments = '' THEN '[]'::jsonb
        ELSE medicaments::jsonb
    END;
ALTER TABLE dossier.ordonnances
    ALTER COLUMN medicaments SET DEFAULT '[]'::jsonb;
ALTER TABLE dossier.ordonnances
    ALTER COLUMN medicaments SET NOT NULL;

-- dossier.infos_medicales.allergies (JSON-in-TEXT → JSONB)
ALTER TABLE dossier.infos_medicales
    ALTER COLUMN allergies TYPE jsonb
    USING CASE
        WHEN allergies IS NULL OR allergies = '' THEN '[]'::jsonb
        WHEN allergies LIKE '[%' THEN allergies::jsonb
        ELSE to_jsonb(ARRAY[allergies])
    END;
ALTER TABLE dossier.infos_medicales
    ALTER COLUMN allergies SET DEFAULT '[]'::jsonb;

-- NOTE: carte.cartes_virtuelles structured TEXT fields (allergies, maladies_chroniques,
-- medicaments_actuels, antecedents_chirurgicaux, vaccinations, antecedents_familiaux,
-- contacts_urgence) deferred to V20. Conversion needs coordinated service-layer change
-- since current code writes plain user-form text, not JSON.

-- ============================================================
-- 3. Missing FK indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ordonnances_medecin
    ON dossier.ordonnances(medecin_id);

CREATE INDEX IF NOT EXISTS idx_audit_changed_by
    ON carte.audit_log(changed_by);

-- ============================================================
-- 4. Annuaire search indexes
-- ============================================================

-- Trigram indexes for fuzzy LIKE / ILIKE searches
-- pg_trgm extension lives in auth schema (installed in V4), so qualify the operator
CREATE INDEX IF NOT EXISTS idx_medecin_specialite_trgm
    ON annuaire.medecin_details USING gin (specialite auth.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medecin_ville_trgm
    ON annuaire.medecin_details USING gin (ville auth.gin_trgm_ops);

-- Composite for exact-match filtering (most common search pattern)
CREATE INDEX IF NOT EXISTS idx_medecin_specialite_ville
    ON annuaire.medecin_details(specialite, ville);

-- Name search on auth.users (firstName / lastName)
CREATE INDEX IF NOT EXISTS idx_users_lastname_trgm
    ON auth.users USING gin (last_name auth.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_firstname_trgm
    ON auth.users USING gin (first_name auth.gin_trgm_ops);

-- ============================================================
-- 5. Geo composite index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_medecin_geo
    ON annuaire.medecin_details(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================
-- 6. updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auth.users
DROP TRIGGER IF EXISTS trg_users_updated_at ON auth.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- dossier.infos_medicales
DROP TRIGGER IF EXISTS trg_infos_medicales_updated_at ON dossier.infos_medicales;
CREATE TRIGGER trg_infos_medicales_updated_at
    BEFORE UPDATE ON dossier.infos_medicales
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- carte.cartes_virtuelles
DROP TRIGGER IF EXISTS trg_cartes_updated_at ON carte.cartes_virtuelles;
CREATE TRIGGER trg_cartes_updated_at
    BEFORE UPDATE ON carte.cartes_virtuelles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 7. audit_log enrichment
-- ============================================================

ALTER TABLE carte.audit_log
    ADD COLUMN IF NOT EXISTS old_value jsonb,
    ADD COLUMN IF NOT EXISTS new_value jsonb;

CREATE INDEX IF NOT EXISTS idx_audit_card_created
    ON carte.audit_log(card_id, created_at DESC);
