-- Idempotency key for messages (client-generated UUID, prevents duplicate sends)
ALTER TABLE messaging.message
    ADD COLUMN IF NOT EXISTS client_msg_id VARCHAR(36);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_client_msg_id
    ON messaging.message(client_msg_id)
    WHERE client_msg_id IS NOT NULL;
