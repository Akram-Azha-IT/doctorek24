-- Messages vocaux : un message est soit TEXT (content), soit AUDIO (fichier MinIO référencé).
ALTER TABLE messaging.message
    ADD COLUMN message_type       VARCHAR(10)  NOT NULL DEFAULT 'TEXT',
    ADD COLUMN media_key          VARCHAR(512),
    ADD COLUMN media_duration_sec INTEGER,
    ADD COLUMN media_mime         VARCHAR(100);

-- content devient optionnel (un message audio n'a pas de texte).
ALTER TABLE messaging.message
    ALTER COLUMN content DROP NOT NULL;

-- Cohérence : TEXT ⇒ content présent ; AUDIO ⇒ media_key présent + durée bornée (<= 120s).
ALTER TABLE messaging.message
    ADD CONSTRAINT chk_message_payload CHECK (
        (message_type = 'TEXT'  AND content   IS NOT NULL)
     OR (message_type = 'AUDIO' AND media_key IS NOT NULL
                                AND media_duration_sec IS NOT NULL
                                AND media_duration_sec BETWEEN 1 AND 120)
    );
