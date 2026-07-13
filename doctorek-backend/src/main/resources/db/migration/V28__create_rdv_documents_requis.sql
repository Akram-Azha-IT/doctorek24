-- Préparation des rendez-vous : documents (médicaux ou administratifs)
-- demandés par le médecin au patient en amont d'un RDV.
CREATE TABLE IF NOT EXISTS agenda.rdv_documents_requis (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id      UUID NOT NULL REFERENCES agenda.rendez_vous(id) ON DELETE CASCADE,
    libelle     VARCHAR(255) NOT NULL,
    fourni      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rdv_documents_requis_rdv ON agenda.rdv_documents_requis(rdv_id);
