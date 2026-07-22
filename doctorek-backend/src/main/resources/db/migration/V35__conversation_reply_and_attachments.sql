-- Feature 1 : le médecin contrôle si le patient peut répondre (par conversation).
ALTER TABLE messaging.conversation
    ADD COLUMN patient_can_reply BOOLEAN NOT NULL DEFAULT true;

-- Feature 2 : pièces jointes (documents) dans les messages — réutilise media_key/media_mime.
ALTER TABLE messaging.message
    ADD COLUMN media_filename VARCHAR(255),
    ADD COLUMN media_size     BIGINT;

-- Étend la contrainte de cohérence du payload au type DOCUMENT.
ALTER TABLE messaging.message DROP CONSTRAINT IF EXISTS chk_message_payload;
ALTER TABLE messaging.message
    ADD CONSTRAINT chk_message_payload CHECK (
        (message_type = 'TEXT'  AND content IS NOT NULL)
     OR (message_type = 'AUDIO' AND media_key IS NOT NULL
                                AND media_duration_sec IS NOT NULL
                                AND media_duration_sec BETWEEN 1 AND 120)
     OR (message_type = 'DOCUMENT' AND media_key IS NOT NULL
                                   AND media_filename IS NOT NULL)
    );
