ALTER TABLE agenda.rendez_vous
    ALTER COLUMN questionnaire_json TYPE jsonb
    USING questionnaire_json::jsonb;
