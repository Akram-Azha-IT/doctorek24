-- ============================================================
-- V18 : Seed — Médecins de Mohammedia (données réelles)
-- Source : annuaire-gratuit.ma, telecontact.ma, e-rdv.ma
-- Mot de passe par défaut : Doctorek2025
-- BCrypt cost 10 : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi
-- ============================================================

-- -------------------------------------------------------
-- 1. Médecins généralistes
-- -------------------------------------------------------
INSERT INTO auth.users (id, email, phone, password, first_name, last_name, role, lang, is_active, email_verified)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'abdelali.balamane@doctorek.ma',   '+212523300001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdelali',       'Balamane',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000002', 'touria.benyoussef@doctorek.ma',   '+212523300002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Touria',         'Benyoussef',     'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000003', 'saadia.sabouri@doctorek.ma',      '+212523300003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Saadia',         'Sabouri',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000004', 'abdellah.tayeb@doctorek.ma',      '+212523300004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdellah',       'Tayeb',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000005', 'brigitte.barere@doctorek.ma',     '+212523300005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Brigitte',       'Barere',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000006', 'mohamed.zamani@doctorek.ma',      '+212523322743', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Mohamed',        'Zamani',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000007', 'said.chibane@doctorek.ma',        '+212523324742', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Said',           'Chibane',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000008', 'nezha.margaoui@doctorek.ma',      '+212523312480', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Nezha',          'Margaoui',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000009', 'shahrazade.elalami@doctorek.ma',  '+212523300009', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Shahrazade',     'Elalami',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000010', 'rachida.fejr@doctorek.ma',        '+212523300010', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Rachida',        'Fejr',           'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000011', 'hassan.rahmouni@doctorek.ma',     '+212523300011', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Hassan',         'Rahmouni',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000012', 'naima.sabouni@doctorek.ma',       '+212522212958', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Naima',          'Sabouni',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000013', 'abdellah.jadid@doctorek.ma',      '+212523322114', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdellah',       'Jadid',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000014', 'mohamed.azmani@doctorek.ma',      '+212523300014', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Mohamed',        'Azmani',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000015', 'elmehdi.elouaai@doctorek.ma',     '+212523300015', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Elmehdi',        'Elouaai',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000016', 'omar.bjanid@doctorek.ma',         '+212523326929', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Omar',           'Bjanid',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000017', 'malika.elalaoui@doctorek.ma',     '+212523323105', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Malika',         'Elalaoui',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000018', 'fouad.elaydi@doctorek.ma',        '+212523326825', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Fouad',          'Elaydi',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000019', 'latifa.frindi@doctorek.ma',       '+212523300019', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Latifa',         'Frindi',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000020', 'hidaya.benzian@doctorek.ma',      '+212523300020', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Hidaya',         'Benzian',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000021', 'rachid.berkane@doctorek.ma',      '+212523300021', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Rachid',         'Berkane',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000022', 'abdelhafid.bitar@doctorek.ma',    '+212523300022', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdelhafid',     'Bitar',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000023', 'saida.belhamid@doctorek.ma',      '+212523300023', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Saida',          'Belhamid',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000024', 'hicham.korchi@doctorek.ma',       '+212523300024', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Hicham',         'Korchi',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000025', 'zahra.hkim@doctorek.ma',          '+212523300025', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Zahra',          'Hkim',           'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000026', 'abdelmajid.najimi@doctorek.ma',   '+212523300026', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdelmajid',     'Najimi',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000027', 'lahoucine.ahnennai@doctorek.ma',  '+212523300027', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Lahoucine',      'Ahnennai',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000028', 'ahmed.squalli@doctorek.ma',       '+212523300028', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Ahmed',          'Squalli',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000029', 'ahmed.boutalouss@doctorek.ma',    '+212523300029', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Ahmed',          'Boutalouss',     'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000030', 'naima.bakrymellouk@doctorek.ma',  '+212523300030', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Naima',          'Bakry Mellouk',  'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000031', 'abderrahim.naim@doctorek.ma',     '+212523300031', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abderrahim',     'Naïm',           'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000032', 'touria.abbari@doctorek.ma',       '+212523300032', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Touria',         'Abbari',         'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 2. Cardiologues
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000033', 'soumia.mhanna@doctorek.ma',       '+212523285959', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Soumia',         'Mhanna',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000034', 'abderrahim.bentammar@doctorek.ma','+212523326460', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abderrahim',     'Bentammar',      'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 3. Gynécologues
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000035', 'mohammed.nabih@doctorek.ma',      '+212523323333', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Mohammed',       'Nabih',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000036', 'nezha.lebbar@doctorek.ma',        '+212523315855', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Nezha',          'Lebbar',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000037', 'badia.benslimane@doctorek.ma',    '+212523329381', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Badia',          'Benslimane',     'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000038', 'moulay.raoui@doctorek.ma',        '+212523286100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Moulay Ismail',  'Raoui',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000039', 'lahcen.falaq@doctorek.ma',        '+212523300039', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Lahcen',         'Falaq',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000040', 'imad.elkouarty@doctorek.ma',      '+212523300040', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Imad',           'El Kouarty',     'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 4. Dermatologues
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000041', 'jamil.benkirane@doctorek.ma',     '+212523313992', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Jamil',          'Benkirane',      'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000042', 'hassan.sahi@doctorek.ma',         '+212523300042', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Hassan',         'Sahi',           'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000043', 'taher.loudiye@doctorek.ma',       '+212523323238', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Taher',          'Loudiye Homman', 'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000044', 'samir.khadir@doctorek.ma',        '+212523300044', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Samir',          'Khadir',         'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 5. Gastroentérologues
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000045', 'bouchra.madi@doctorek.ma',        '+212523281530', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Bouchra',        'Madi',           'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000046', 'fatima.aarab@doctorek.ma',        '+212523320448', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Fatima',         'Aarab',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000047', 'noureddine.mallouk@doctorek.ma',  '+212523300047', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Noureddine',     'Mallouk',        'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 6. Chirurgiens généraux
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000048', 'nabil.maher@doctorek.ma',         '+212523300048', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Nabil',          'Maher',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000049', 'abdellatif.choukri@doctorek.ma',  '+212523300049', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Abdellatif',     'Choukri',        'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000050', 'ahmed.aitelasri@doctorek.ma',     '+212523300050', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Ahmed',          'Ait Elasri',     'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000051', 'bachir.mekkaoui@doctorek.ma',     '+212523329382', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Bachir',         'Mekkaoui',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000052', 'faissal.ziyani@doctorek.ma',      '+212523316100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Faissal',        'Ziyani',         'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000053', 'elmostafa.garch@doctorek.ma',     '+212523313016', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Elmostafa',      'Garch',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000054', 'mouhsine.salmouni@doctorek.ma',   '+212523300054', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Mouhsine',       'Salmouni',       'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000055', 'omar.allam@doctorek.ma',          '+212523300055', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Omar',           'Allam',          'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000056', 'aziz.khadim@doctorek.ma',         '+212523300056', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Aziz',           'Khadim',         'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 7. Pneumologue
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000057', 'mohamed.aliati@doctorek.ma',      '+212523300057', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Mohamed',        'Aliati',         'MEDECIN', 'fr', true, true),
-- -------------------------------------------------------
-- 8. Biologistes médicaux
-- -------------------------------------------------------
  ('a0000000-0000-0000-0000-000000000058', 'driss.essobaihi@doctorek.ma',     '+212523300058', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Driss',          'Essobaihi',      'MEDECIN', 'fr', true, true),
  ('a0000000-0000-0000-0000-000000000059', 'wafae.chihab@doctorek.ma',        '+212523300059', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVujk3D2oi', 'Wafae',          'Chihab',         'MEDECIN', 'fr', true, true)
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------
-- medecin_details
-- Coords centre Mohammedia : 33.6862 N, -7.3827 W
-- -------------------------------------------------------
INSERT INTO annuaire.medecin_details (user_id, inpe, specialite, ville, adresse, latitude, longitude)
VALUES
  -- Généralistes
  ('a0000000-0000-0000-0000-000000000001', 'MAR0000001', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6870, -7.3820),
  ('a0000000-0000-0000-0000-000000000002', 'MAR0000002', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6865, -7.3815),
  ('a0000000-0000-0000-0000-000000000003', 'MAR0000003', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6860, -7.3810),
  ('a0000000-0000-0000-0000-000000000004', 'MAR0000004', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6855, -7.3805),
  ('a0000000-0000-0000-0000-000000000005', 'MAR0000005', 'Médecine Générale',     'Mohammedia', 'Bd Hassan II, Lot. Sania n°33, Mohammedia',     33.6862, -7.3827),
  ('a0000000-0000-0000-0000-000000000006', 'MAR0000006', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6875, -7.3835),
  ('a0000000-0000-0000-0000-000000000007', 'MAR0000007', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6845, -7.3800),
  ('a0000000-0000-0000-0000-000000000008', 'MAR0000008', 'Médecine Générale',     'Mohammedia', '76 Bd Yaacoub El Mansour, Mohammedia',          33.6850, -7.3845),
  ('a0000000-0000-0000-0000-000000000009', 'MAR0000009', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6840, -7.3790),
  ('a0000000-0000-0000-0000-000000000010', 'MAR0000010', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6835, -7.3785),
  ('a0000000-0000-0000-0000-000000000011', 'MAR0000011', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6830, -7.3780),
  ('a0000000-0000-0000-0000-000000000012', 'MAR0000012', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6825, -7.3775),
  ('a0000000-0000-0000-0000-000000000013', 'MAR0000013', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6820, -7.3770),
  ('a0000000-0000-0000-0000-000000000014', 'MAR0000014', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6815, -7.3765),
  ('a0000000-0000-0000-0000-000000000015', 'MAR0000015', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6810, -7.3760),
  ('a0000000-0000-0000-0000-000000000016', 'MAR0000016', 'Médecine Générale',     'Mohammedia', 'Bd Palestine, Imm. Ahbar, Mohammedia',          33.6880, -7.3855),
  ('a0000000-0000-0000-0000-000000000017', 'MAR0000017', 'Médecine Générale',     'Mohammedia', '168 Bd Monastir, Mohammedia',                   33.6890, -7.3860),
  ('a0000000-0000-0000-0000-000000000018', 'MAR0000018', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6805, -7.3755),
  ('a0000000-0000-0000-0000-000000000019', 'MAR0000019', 'Médecine Générale',     'Mohammedia', '629 Bd de la Résistance, Hay Hassania, Mohammedia', 33.6800, -7.3750),
  ('a0000000-0000-0000-0000-000000000020', 'MAR0000020', 'Médecine Générale',     'Mohammedia', 'Derb Marrakech, Bloc 18 n°30, Mohammedia',      33.6795, -7.3745),
  ('a0000000-0000-0000-0000-000000000021', 'MAR0000021', 'Médecine Générale',     'Mohammedia', '3 Bd Chourafa, 1er ét., El Alia, Mohammedia',   33.6790, -7.3740),
  ('a0000000-0000-0000-0000-000000000022', 'MAR0000022', 'Médecine Générale',     'Mohammedia', '321 Bd Palestine, Riad 2, El Alia, Mohammedia', 33.6785, -7.3735),
  ('a0000000-0000-0000-0000-000000000023', 'MAR0000023', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6780, -7.3730),
  ('a0000000-0000-0000-0000-000000000024', 'MAR0000024', 'Médecine Générale',     'Mohammedia', 'Mohammedia',                                    33.6775, -7.3725),
  ('a0000000-0000-0000-0000-000000000025', 'MAR0000025', 'Médecine Générale',     'Mohammedia', '132 Rue Souss, Mohammedia',                     33.6770, -7.3720),
  ('a0000000-0000-0000-0000-000000000026', 'MAR0000026', 'Médecine Générale',     'Mohammedia', '234 Bd Moukaouama, Hay Hassania I, Mohammedia', 33.6765, -7.3715),
  ('a0000000-0000-0000-0000-000000000027', 'MAR0000027', 'Médecine Générale',     'Mohammedia', '224 Bd Moukaouama, 1er ét., Mohammedia',        33.6760, -7.3710),
  ('a0000000-0000-0000-0000-000000000028', 'MAR0000028', 'Médecine Générale',     'Mohammedia', '137 Bd Monastir, Derb Meknès, El Alia, Mohammedia', 33.6755, -7.3705),
  ('a0000000-0000-0000-0000-000000000029', 'MAR0000029', 'Médecine Générale',     'Mohammedia', '3 Bd Hassan II, Imm. Taghi, 1er ét., Mohammedia', 33.6750, -7.3700),
  ('a0000000-0000-0000-0000-000000000030', 'MAR0000030', 'Médecine Générale',     'Mohammedia', '1 Bd des F.A.R., Mohammedia',                   33.6745, -7.3695),
  ('a0000000-0000-0000-0000-000000000031', 'MAR0000031', 'Médecine Générale',     'Mohammedia', 'Rue Doukkala, Résid. Walili, Mohammedia',       33.6740, -7.3690),
  ('a0000000-0000-0000-0000-000000000032', 'MAR0000032', 'Médecine Générale',     'Mohammedia', 'Hay Hassania II, Mohammedia',                   33.6735, -7.3685),
  -- Cardiologues
  ('a0000000-0000-0000-0000-000000000033', 'MAR0000033', 'Cardiologie',           'Mohammedia', 'Mohammedia',                                    33.6895, -7.3865),
  ('a0000000-0000-0000-0000-000000000034', 'MAR0000034', 'Cardiologie',           'Mohammedia', 'Mohammedia',                                    33.6900, -7.3870),
  -- Gynécologues
  ('a0000000-0000-0000-0000-000000000035', 'MAR0000035', 'Gynécologie-Obstétrique','Mohammedia','Mohammedia',                                    33.6905, -7.3875),
  ('a0000000-0000-0000-0000-000000000036', 'MAR0000036', 'Gynécologie-Obstétrique','Mohammedia','Mohammedia',                                    33.6910, -7.3880),
  ('a0000000-0000-0000-0000-000000000037', 'MAR0000037', 'Gynécologie-Obstétrique','Mohammedia','Mohammedia',                                    33.6915, -7.3885),
  ('a0000000-0000-0000-0000-000000000038', 'MAR0000038', 'Gynécologie-Obstétrique','Mohammedia','Mohammedia',                                    33.6920, -7.3890),
  ('a0000000-0000-0000-0000-000000000039', 'MAR0000039', 'Gynécologie-Obstétrique','Mohammedia','Bd Monastir N°9, Hay Chabab A, Al Alia, Mohammedia', 33.6925, -7.3895),
  ('a0000000-0000-0000-0000-000000000040', 'MAR0000040', 'Gynécologie-Obstétrique','Mohammedia','Mohammedia',                                    33.6930, -7.3900),
  -- Dermatologues
  ('a0000000-0000-0000-0000-000000000041', 'MAR0000041', 'Dermatologie',          'Mohammedia', 'Mohammedia',                                    33.6730, -7.3680),
  ('a0000000-0000-0000-0000-000000000042', 'MAR0000042', 'Dermatologie',          'Mohammedia', 'Mohammedia',                                    33.6725, -7.3675),
  ('a0000000-0000-0000-0000-000000000043', 'MAR0000043', 'Dermatologie',          'Mohammedia', 'Mohammedia',                                    33.6720, -7.3670),
  ('a0000000-0000-0000-0000-000000000044', 'MAR0000044', 'Dermatologie',          'Mohammedia', '230 Bd Moulay Rachid, Rachidia II, Mohammedia', 33.6715, -7.3665),
  -- Gastroentérologues
  ('a0000000-0000-0000-0000-000000000045', 'MAR0000045', 'Gastro-entérologie',    'Mohammedia', 'Mohammedia',                                    33.6710, -7.3660),
  ('a0000000-0000-0000-0000-000000000046', 'MAR0000046', 'Gastro-entérologie',    'Mohammedia', 'Mohammedia',                                    33.6705, -7.3655),
  ('a0000000-0000-0000-0000-000000000047', 'MAR0000047', 'Gastro-entérologie',    'Mohammedia', 'Mohammedia',                                    33.6700, -7.3650),
  -- Chirurgiens généraux
  ('a0000000-0000-0000-0000-000000000048', 'MAR0000048', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6695, -7.3645),
  ('a0000000-0000-0000-0000-000000000049', 'MAR0000049', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6690, -7.3640),
  ('a0000000-0000-0000-0000-000000000050', 'MAR0000050', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6685, -7.3635),
  ('a0000000-0000-0000-0000-000000000051', 'MAR0000051', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6680, -7.3630),
  ('a0000000-0000-0000-0000-000000000052', 'MAR0000052', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6675, -7.3625),
  ('a0000000-0000-0000-0000-000000000053', 'MAR0000053', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6670, -7.3620),
  ('a0000000-0000-0000-0000-000000000054', 'MAR0000054', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6665, -7.3615),
  ('a0000000-0000-0000-0000-000000000055', 'MAR0000055', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6660, -7.3610),
  ('a0000000-0000-0000-0000-000000000056', 'MAR0000056', 'Chirurgie Générale',    'Mohammedia', 'Mohammedia',                                    33.6655, -7.3605),
  -- Pneumologue
  ('a0000000-0000-0000-0000-000000000057', 'MAR0000057', 'Pneumologie',           'Mohammedia', '586 Bd Al Mouarabitine, Hay Hassania I, Mohammedia', 33.6650, -7.3600),
  -- Biologistes médicaux
  ('a0000000-0000-0000-0000-000000000058', 'MAR0000058', 'Biologie Médicale',     'Mohammedia', 'Mohammedia',                                    33.6645, -7.3595),
  ('a0000000-0000-0000-0000-000000000059', 'MAR0000059', 'Biologie Médicale',     'Mohammedia', 'Mohammedia',                                    33.6640, -7.3590)
ON CONFLICT (user_id) DO NOTHING;
