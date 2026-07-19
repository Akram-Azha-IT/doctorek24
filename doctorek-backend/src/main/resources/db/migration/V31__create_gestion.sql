-- Compte famille : relation de gestion many-to-many.
-- Un compte (gestionnaire) peut gérer plusieurs patients (proches) ;
-- un patient peut être géré par plusieurs comptes (ex. parents séparés).
CREATE TABLE patient.gestion (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gestionnaire_compte_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id                      UUID NOT NULL REFERENCES patient.patient(id) ON DELETE CASCADE,
    role                            VARCHAR(30) NOT NULL
        CHECK (role IN ('PARENT', 'TUTEUR', 'AIDANT', 'REPRESENTANT_LEGAL')),
    -- Case légale obligatoire cochée à l'ajout du proche (base légale, tracée)
    declaration_representant_legal BOOLEAN NOT NULL,
    actif                           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_gestion_gestionnaire_patient UNIQUE (gestionnaire_compte_id, patient_id)
);

CREATE INDEX idx_gestion_gestionnaire ON patient.gestion(gestionnaire_compte_id) WHERE actif;
CREATE INDEX idx_gestion_patient ON patient.gestion(patient_id) WHERE actif;
