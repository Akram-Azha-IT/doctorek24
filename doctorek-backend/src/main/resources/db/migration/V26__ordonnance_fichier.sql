ALTER TABLE dossier.ordonnances
    ADD COLUMN IF NOT EXISTS fichier_chemin VARCHAR(500),
    ADD COLUMN IF NOT EXISTS fichier_nom    VARCHAR(255);
