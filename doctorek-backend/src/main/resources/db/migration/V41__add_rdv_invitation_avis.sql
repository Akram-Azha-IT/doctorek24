-- ============================================================
-- V41 : Clôture automatique des rendez-vous passés + invitation à noter
-- ------------------------------------------------------------
-- Un rendez-vous ne passait à TERMINE que si le médecin cliquait. En
-- consultation, personne ne clique : les rendez-vous restaient CONFIRME
-- indéfiniment et aucun patient ne pouvait déposer d'avis. Le temps qui
-- passe fait désormais foi, et une invitation part le lendemain.
--
-- La marque d'envoi évite qu'un redémarrage le même jour renvoie
-- l'invitation — même rôle que rappel_30min_envoye_at.
-- ============================================================
ALTER TABLE agenda.rendez_vous
    ADD COLUMN IF NOT EXISTS avis_invitation_envoyee_at TIMESTAMPTZ;

-- Balayage quotidien : les terminés d'hier pas encore invités.
CREATE INDEX IF NOT EXISTS idx_rdv_invitation_avis_en_attente
    ON agenda.rendez_vous (date_rdv)
    WHERE statut = 'TERMINE' AND avis_invitation_envoyee_at IS NULL;
