-- Un creneau ne peut porter qu'un seul rendez-vous actif.
--
-- La contrainte d'origine (V5) ignorait le statut : une fois un rendez-vous annule,
-- son creneau restait verrouille pour toujours. L'agenda l'affichait pourtant libre,
-- et toute tentative de reservation echouait -- y compris celles declenchees par la
-- liste d'attente. On la remplace par un index partiel qui exclut les annulations.
ALTER TABLE agenda.rendez_vous
    DROP CONSTRAINT IF EXISTS uq_rdv_medecin_datetime;

-- La verification applicative lit puis insere : deux reservations simultanees la
-- franchissent toutes les deux. Cet index reste le seul arbitre reel de la course,
-- d'autant qu'une place liberee previent desormais plusieurs patients a la fois.
CREATE UNIQUE INDEX IF NOT EXISTS uq_rdv_creneau_actif
    ON agenda.rendez_vous (medecin_id, date_rdv, heure_rdv)
 WHERE statut <> 'ANNULE';

-- Patients souhaitant une place plus tot chez un medecin, sur une plage de dates.
CREATE TABLE IF NOT EXISTS agenda.liste_attente (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id               UUID NOT NULL REFERENCES patient.patient(id) ON DELETE CASCADE,
    -- Compte a l'origine de l'inscription : le patient, ou le titulaire pour un proche.
    cree_par                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    date_debut               DATE NOT NULL,
    date_fin                 DATE NOT NULL,
    statut                   VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    derniere_notification_at TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_liste_attente_plage  CHECK (date_fin >= date_debut),
    CONSTRAINT ck_liste_attente_statut CHECK (statut IN ('ACTIVE', 'SERVIE', 'ANNULEE'))
);

-- Une seule attente active par patient chez un meme medecin.
CREATE UNIQUE INDEX IF NOT EXISTS uq_liste_attente_active
    ON agenda.liste_attente (medecin_id, patient_id)
 WHERE statut = 'ACTIVE';

-- Recherche des candidats au moment ou un creneau se libere.
CREATE INDEX IF NOT EXISTS idx_liste_attente_recherche
    ON agenda.liste_attente (medecin_id, date_debut, date_fin)
 WHERE statut = 'ACTIVE';
