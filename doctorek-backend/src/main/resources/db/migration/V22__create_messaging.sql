CREATE SCHEMA IF NOT EXISTS messaging;

CREATE TABLE messaging.conversation (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id  UUID NOT NULL REFERENCES auth.users(id),
    patient_id  UUID NOT NULL REFERENCES auth.users(id),
    last_message_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_pair UNIQUE (medecin_id, patient_id)
);

CREATE INDEX idx_conversation_medecin ON messaging.conversation(medecin_id);
CREATE INDEX idx_conversation_patient ON messaging.conversation(patient_id);

CREATE TABLE messaging.message (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES messaging.conversation(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES auth.users(id),
    content         TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_message_conv_sent ON messaging.message(conversation_id, sent_at DESC);
