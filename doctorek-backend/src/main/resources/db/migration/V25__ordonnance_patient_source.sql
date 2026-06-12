-- Allow patient-added ordonnances (doctor without account)
ALTER TABLE dossier.ordonnances
    ALTER COLUMN medecin_id DROP NOT NULL;

ALTER TABLE dossier.ordonnances
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'MEDECIN',
    ADD COLUMN IF NOT EXISTS medecin_nom VARCHAR(255);
