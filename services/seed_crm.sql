-- Données de démo CRM (exécuter sur crm_db une fois les migrations .NET appliquées)
-- Colonnes = noms générés par Entity Framework (Npgsql, identifiants sensibles à la casse)

INSERT INTO campagnes_marketing ("Nom", "Budget", "DateDebut", "DateFin")
SELECT 'Lancement Produit X', 50000, NOW(), NOW() + INTERVAL '1 month'
WHERE NOT EXISTS (SELECT 1 FROM campagnes_marketing LIMIT 1);

INSERT INTO campagnes_marketing ("Nom", "Budget", "DateDebut", "DateFin")
SELECT 'Promotion Eté 2024', 12000, NOW() + INTERVAL '45 days', NOW() + INTERVAL '90 days'
WHERE NOT EXISTS (SELECT 1 FROM campagnes_marketing WHERE "Nom" = 'Promotion Eté 2024');

-- Statut : 0=NOUVEAU, 1=QUALIFIE, … (enum LeadStatut)
INSERT INTO leads ("Source", "Statut", "Score", "DateCreation", "NomContact", "Email", "Telephone", "Entreprise")
SELECT 'Site Web', 0, 85, NOW(), 'Marwan Kiker', 'marwan@maka.tech', '0612345678', 'MAKA Tech'
WHERE NOT EXISTS (SELECT 1 FROM leads LIMIT 1);

INSERT INTO leads ("Source", "Statut", "Score", "DateCreation", "NomContact", "Email", "Telephone", "Entreprise")
SELECT 'Recommandation', 1, 92, NOW(), 'Sara Mansouri', 'sara@consulting.ma', '0688776655', 'Mansouri Consulting'
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE "Email" = 'sara@consulting.ma');
