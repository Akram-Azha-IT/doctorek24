-- ============================================================
-- V42 : Consentement au traitement des donnees (loi 09-08)
-- ------------------------------------------------------------
-- La loi 09-08 exige un consentement prealable, explicite et PROUVABLE.
-- Une case cochee dans un formulaire ne prouve rien une fois la page fermee :
-- l'acceptation est donc horodatee et rattachee a la version du texte accepte.
--
-- Table d'historique et non deux colonnes sur auth.users : quand le texte change,
-- la nouvelle acceptation ne doit pas effacer la trace de la precedente.
-- ============================================================
CREATE TABLE IF NOT EXISTS auth.consentement (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version    VARCHAR(32) NOT NULL,
    source     VARCHAR(20) NOT NULL,
    accepte_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_consentement_source CHECK (source IN ('INSCRIPTION', 'CONNEXION'))
);

-- Un compte n'accepte une version donnee qu'une fois : un double envoi ne cree pas
-- deux preuves contradictoires du meme accord.
CREATE UNIQUE INDEX IF NOT EXISTS uq_consentement_user_version
    ON auth.consentement (user_id, version);

-- Lecture a chaque connexion : « ce compte a-t-il accepte la version courante ? »
CREATE INDEX IF NOT EXISTS idx_consentement_user
    ON auth.consentement (user_id, accepte_at DESC);
