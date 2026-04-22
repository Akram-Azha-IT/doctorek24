ALTER TABLE agenda.rendez_vous
    ADD COLUMN IF NOT EXISTS questionnaire_json TEXT;
