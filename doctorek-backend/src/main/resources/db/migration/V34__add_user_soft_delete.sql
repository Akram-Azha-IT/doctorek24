-- ============================================================
-- V34 : Suppression de compte (soft delete + anonymisation)
-- ------------------------------------------------------------
-- Un compte "supprimé" garde sa ligne (rétention légale des données
-- médicales liées : dossier, ordonnances, RDV) mais son identité est
-- anonymisée. L'email/téléphone d'origine sont ainsi libérés pour une
-- ré-inscription, sans casser l'intégrité référentielle.
-- ============================================================
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Les listes admin et l'authentification filtrent sur ce statut.
CREATE INDEX IF NOT EXISTS idx_users_status ON auth.users(status);
