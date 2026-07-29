-- Marque d'idempotence du rappel J-0 : la tâche tourne chaque minute sur une
-- fenetre large, cette colonne garantit un seul envoi par rendez-vous.
ALTER TABLE agenda.rendez_vous
    ADD COLUMN IF NOT EXISTS rappel_30min_envoye_at TIMESTAMPTZ;

-- Les rendez-vous deja passes n'ont plus de rappel a recevoir : on les marque
-- pour eviter toute vague de rattrapage au premier demarrage.
UPDATE agenda.rendez_vous
   SET rappel_30min_envoye_at = now()
 WHERE rappel_30min_envoye_at IS NULL
   AND date_rdv <= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_rdv_rappel_a_envoyer
    ON agenda.rendez_vous (date_rdv)
 WHERE rappel_30min_envoye_at IS NULL;
