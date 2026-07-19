-- Compte famille : les RDV pointent désormais vers patient.patient (pivot),
-- plus vers auth.users. Les valeurs patient_id existantes restent valides
-- grâce au backfill V30 (patient.id = users.id).
-- Le nom de la FK créée en V5 est auto-généré → suppression dynamique.
DO $$
DECLARE c TEXT;
BEGIN
    FOR c IN
        SELECT DISTINCT con.conname
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
        WHERE con.conrelid = 'agenda.rendez_vous'::regclass
          AND con.contype = 'f'
          AND a.attname = 'patient_id'
    LOOP
        EXECUTE format('ALTER TABLE agenda.rendez_vous DROP CONSTRAINT %I', c);
    END LOOP;
END $$;

ALTER TABLE agenda.rendez_vous
    ADD CONSTRAINT fk_rdv_patient FOREIGN KEY (patient_id) REFERENCES patient.patient(id);
