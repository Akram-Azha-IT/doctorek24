CREATE SCHEMA IF NOT EXISTS agenda;

CREATE TABLE agenda.disponibilites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    jour_semaine        VARCHAR(10) NOT NULL,
    heure_debut         TIME NOT NULL,
    heure_fin           TIME NOT NULL,
    duree_consultation  INT  NOT NULL DEFAULT 30,
    CONSTRAINT uq_dispo_medecin_jour UNIQUE (medecin_id, jour_semaine)
);

CREATE TABLE agenda.rendez_vous (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id  UUID NOT NULL REFERENCES auth.users(id),
    patient_id  UUID NOT NULL REFERENCES auth.users(id),
    date_rdv    DATE NOT NULL,
    heure_rdv   TIME NOT NULL,
    duree       INT  NOT NULL,
    statut      VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    motif       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rdv_medecin_datetime UNIQUE (medecin_id, date_rdv, heure_rdv)
);

CREATE INDEX idx_dispo_medecin ON agenda.disponibilites(medecin_id);
CREATE INDEX idx_rdv_medecin_date ON agenda.rendez_vous(medecin_id, date_rdv);
CREATE INDEX idx_rdv_patient ON agenda.rendez_vous(patient_id);
