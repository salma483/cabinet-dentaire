-- Script d'initialisation pour PostgreSQL
-- Cabinet Dentaire Dr. Ayadi

-- Table des utilisateurs (Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des patients
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    birth_date DATE,
    montant_total DECIMAL(10, 2) DEFAULT 0,
    montant_paye DECIMAL(10, 2) DEFAULT 0,
    montant_restant DECIMAL(10, 2) DEFAULT 0,
    paiement_status VARCHAR(50) DEFAULT 'non_paye',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des rendez-vous
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP,
    time VARCHAR(10),
    status VARCHAR(50) DEFAULT 'en_attente',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des consultations
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_date DATE,
    diagnosis TEXT,
    observation TEXT,
    prescription TEXT,
    treatment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des médicaments/achats
CREATE TABLE IF NOT EXISTS medicaments (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prix_unitaire DECIMAL(10, 2),
    quantite_achetee INTEGER DEFAULT 0,
    quantite_disponible INTEGER DEFAULT 0,
    description TEXT,
    fournisseur VARCHAR(255),
    date_expiration DATE,
    alerte_stock INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    montant DECIMAL(10, 2) NOT NULL,
    date_paiement DATE,
    type_paiement VARCHAR(50) DEFAULT 'espece',
    notes TEXT,
    numero_cheque VARCHAR(50),
    banque_cheque VARCHAR(255),
    montant_cheque DECIMAL(10, 2),
    date_emission_cheque DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alertes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(50),
    message TEXT,
    status VARCHAR(50) DEFAULT 'non_lue',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des radiographies
CREATE TABLE IF NOT EXISTS radiographies (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    file_path VARCHAR(255),
    description TEXT,
    consultation_id INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_paiements_patient ON paiements(patient_id);
CREATE INDEX IF NOT EXISTS idx_alertes_patient ON alertes(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiographies_patient ON radiographies(patient_id);

-- Insérer l'utilisateur admin par défaut (email: admin@dentiste.com, password: admin123)
INSERT INTO users (email, password) 
VALUES ('admin@dentiste.com', '$2a$10$DjVE0k3VQvZvUI0w1V3H7OPST9/PgBkqquzi.Ss7KIUgO2nke2jFm')
ON CONFLICT (email) DO NOTHING;
