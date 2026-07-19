-- Compte famille : entité pivot "patient".
-- Toute personne recevant des soins = une ligne patient.patient ;
-- le compte (auth.users) est une capacité optionnelle (compte_id nullable).
CREATE TABLE patient.patient (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             TEXT NOT NULL,
    prenom          TEXT NOT NULL,
    -- Nullable : les comptes existants n'ont pas toujours de date de naissance
    -- (NULL = titulaire de compte, traité comme majeur). L'API l'exige pour les proches.
    date_naissance  DATE,
    lieu_naissance  TEXT,
    email           TEXT,
    telephone       TEXT,
    compte_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_compte_id ON patient.patient(compte_id);

-- Backfill : id = users.id pour que agenda.rendez_vous.patient_id (et les
-- tables dossier.*) restent valides sans réécrire une seule ligne.
-- Cible : tous les users PATIENT + tout user déjà référencé comme patient d'un RDV.
INSERT INTO patient.patient (id, nom, prenom, date_naissance, email, telephone, compte_id)
SELECT u.id,
       u.last_name,
       u.first_name,
       pd.date_naissance,
       u.email,
       COALESCE(pd.telephone, u.phone),
       u.id
FROM auth.users u
LEFT JOIN patient.patient_details pd ON pd.user_id = u.id
WHERE u.role = 'PATIENT'
   OR EXISTS (SELECT 1 FROM agenda.rendez_vous r WHERE r.patient_id = u.id)
ON CONFLICT (id) DO NOTHING;
