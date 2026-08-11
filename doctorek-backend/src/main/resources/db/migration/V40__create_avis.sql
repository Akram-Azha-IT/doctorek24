-- Avis des patients sur leurs medecins.
--
-- Un avis n'existe que s'il est adosse a un rendez-vous TERMINE : c'est ce lien,
-- et non un simple compte connecte, qui atteste que la consultation a eu lieu.
-- L'unicite porte donc sur le rendez-vous, pas sur le couple (medecin, patient) :
-- un patient qui revoit le meme medecin peut redonner son avis.
CREATE TABLE IF NOT EXISTS annuaire.avis (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id   UUID NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
    patient_id   UUID NOT NULL REFERENCES patient.patient(id)     ON DELETE CASCADE,
    rdv_id       UUID NOT NULL REFERENCES agenda.rendez_vous(id)  ON DELETE CASCADE,
    note         SMALLINT NOT NULL,
    commentaire  TEXT,
    -- Le patient choisit d'apparaitre ou non : une consultation reste une donnee de sante.
    anonyme      BOOLEAN NOT NULL DEFAULT false,
    statut       VARCHAR(20) NOT NULL DEFAULT 'PUBLIE',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_avis_note   CHECK (note BETWEEN 1 AND 5),
    CONSTRAINT ck_avis_statut CHECK (statut IN ('PUBLIE', 'SIGNALE', 'MASQUE'))
);

-- Un rendez-vous ne porte qu'un avis. Contrainte en base : la verification
-- applicative lit puis insere, deux envois simultanes la franchiraient tous deux.
CREATE UNIQUE INDEX IF NOT EXISTS uq_avis_rdv ON annuaire.avis (rdv_id);

-- Lecture publique du profil medecin : liste paginee et moyenne.
-- Les avis masques sont exclus de l'index comme ils le sont de la requete.
CREATE INDEX IF NOT EXISTS idx_avis_medecin_publie
    ON annuaire.avis (medecin_id, created_at DESC)
 WHERE statut <> 'MASQUE';

-- Ecran "mes avis" du patient.
CREATE INDEX IF NOT EXISTS idx_avis_patient ON annuaire.avis (patient_id);

-- Signalements : une ligne par signalant, pour qu'un meme compte ne puisse pas
-- faire monter le compteur en boucle. Le decompte se lit, il ne se stocke pas.
CREATE TABLE IF NOT EXISTS annuaire.avis_signalement (
    avis_id    UUID NOT NULL REFERENCES annuaire.avis(id) ON DELETE CASCADE,
    auteur_id  UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
    motif      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (avis_id, auteur_id)
);
