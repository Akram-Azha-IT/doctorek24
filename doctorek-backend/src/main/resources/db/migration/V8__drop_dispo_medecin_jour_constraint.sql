-- Drop the unique constraint on (medecin_id, jour_semaine) to allow multiple availability blocks per day
ALTER TABLE agenda.disponibilites DROP CONSTRAINT IF EXISTS uq_dispo_medecin_jour;
