CREATE SCHEMA IF NOT EXISTS carte;

CREATE TABLE carte.cartes_virtuelles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
    card_ref VARCHAR(30) NOT NULL UNIQUE,
    statut VARCHAR(20) NOT NULL DEFAULT 'VIRTUEL',
    date_naissance DATE,
    genre VARCHAR(20),
    nationalite VARCHAR(100),
    num_identite TEXT,
    photo_url TEXT,
    telephone VARCHAR(30),
    adresse_rue TEXT,
    adresse_ville VARCHAR(100),
    adresse_pays VARCHAR(100),
    groupe_sanguin VARCHAR(10),
    taille_cm INTEGER,
    poids_kg DECIMAL(5,2),
    donneur_organes BOOLEAN DEFAULT FALSE,
    allergies TEXT,
    maladies_chroniques TEXT,
    medicaments_actuels TEXT,
    antecedents_chirurgicaux TEXT,
    vaccinations TEXT,
    antecedents_familiaux TEXT,
    contacts_urgence TEXT,
    medecin_traitant TEXT,
    assurance_nom VARCHAR(255),
    assurance_numero TEXT,
    assurance_details TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE carte.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES carte.cartes_virtuelles(id),
    action VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cartes_patient ON carte.cartes_virtuelles(patient_id);
CREATE INDEX idx_carte_ref ON carte.cartes_virtuelles(card_ref);
CREATE INDEX idx_audit_card ON carte.audit_log(card_id);
