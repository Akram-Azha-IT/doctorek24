-- Composite index for the two most common access patterns:
-- GET /agenda/medecins/{id}/rdv and GET /agenda/patients/{id}/rdv
CREATE INDEX idx_rdv_medecin_id ON agenda.rendez_vous(medecin_id);
CREATE INDEX idx_rdv_patient_id ON agenda.rendez_vous(patient_id);
CREATE INDEX idx_rdv_medecin_date ON agenda.rendez_vous(medecin_id, date_rdv);
