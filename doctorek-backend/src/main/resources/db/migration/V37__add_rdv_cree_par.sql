-- ============================================================
-- V37 : Auteur de la prise de rendez-vous
-- ------------------------------------------------------------
-- Le rendez-vous ne retenait que le patient concerné. Quand un titulaire réserve
-- pour un proche, le médecin voyait donc le nom du proche sans savoir qui avait
-- réellement pris le rendez-vous.
--
-- Colonne nullable : les rendez-vous antérieurs n'ont pas cette information, et
-- un patient créé par le cabinet n'a pas toujours de compte.
-- ON DELETE SET NULL : la suppression d'un compte ne doit pas emporter le
-- rendez-vous, qui reste une donnée de soin.
-- ============================================================
ALTER TABLE agenda.rendez_vous
    ADD COLUMN IF NOT EXISTS cree_par UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_cree_par ON agenda.rendez_vous(cree_par);

COMMENT ON COLUMN agenda.rendez_vous.cree_par IS
    'Compte ayant effectué la réservation : le patient lui-même, le titulaire qui gère le proche, ou le médecin.';
