CREATE SCHEMA IF NOT EXISTS dossier;

CREATE TABLE dossier.infos_medicales (
    patient_id   UUID PRIMARY KEY REFERENCES auth.users(id),
    groupe_sanguin    VARCHAR(10),
    allergies         TEXT,
    antecedents       TEXT,
    traitements_cours TEXT,
    notes_generales   TEXT,
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dossier.ordonnances (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES auth.users(id),
    medecin_id   UUID NOT NULL REFERENCES auth.users(id),
    date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
    medicaments  TEXT NOT NULL DEFAULT '[]',
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ordonnances_patient ON dossier.ordonnances(patient_id);

CREATE TABLE dossier.documents_medicaux (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES auth.users(id),
    nom          VARCHAR(255) NOT NULL,
    type_doc     VARCHAR(50) NOT NULL,
    chemin       TEXT NOT NULL,
    taille       BIGINT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_patient ON dossier.documents_medicaux(patient_id);
