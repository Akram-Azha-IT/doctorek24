-- Compte famille phase 2 : rattachement d'un RDV créé par le praticien.
-- Le patient (créé côté cabinet, sans compte) reçoit un lien email contenant
-- ce token ; le titulaire vérifie les 3 premières lettres du nom puis le
-- patient est rattaché à son compte via patient.gestion.
CREATE TABLE patient.rattachement_token (
    token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES patient.patient(id) ON DELETE CASCADE,
    rdv_id      UUID REFERENCES agenda.rendez_vous(id) ON DELETE SET NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    tentatives  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rattachement_patient ON patient.rattachement_token(patient_id) WHERE used_at IS NULL;
