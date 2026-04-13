-- ============================================================
-- V4 : Activer pg_trgm pour la recherche floue côté serveur
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index trigramme sur specialite et ville pour accélérer similarity()
CREATE INDEX IF NOT EXISTS idx_users_specialite_trgm
    ON auth.users USING GIN (specialite gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_ville_trgm
    ON auth.users USING GIN (ville gin_trgm_ops);
