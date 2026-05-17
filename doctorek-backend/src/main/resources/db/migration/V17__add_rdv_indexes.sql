CREATE INDEX IF NOT EXISTS idx_rdv_medecin_id ON agenda.rendez_vous(medecin_id);
CREATE INDEX IF NOT EXISTS idx_rdv_patient_id ON agenda.rendez_vous(patient_id);
CREATE INDEX IF NOT EXISTS idx_rdv_medecin_date ON agenda.rendez_vous(medecin_id, date_rdv);
