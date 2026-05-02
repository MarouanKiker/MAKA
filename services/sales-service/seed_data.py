import requests
import json
import time

# Script de seeding interne pour MAKA ERP
# Execute ce script pour remplir les bases de donnees avec de vraies donnees.

def seed_crm():
    print("Seeding CRM...")
    # 1. Creer des campagnes
    campagnes = [
        {"nom": "Lancement Produit X", "budget": 50000, "dateDebut": "2024-05-01T00:00:00Z", "dateFin": "2024-06-01T00:00:00Z"},
        {"nom": "Promotion Ete 2024", "budget": 12000, "dateDebut": "2024-06-15T00:00:00Z", "dateFin": "2024-08-30T00:00:00Z"}
    ]
    for c in campagnes:
        try:
            r = requests.post("http://crm-service:5000/api/crm/campagnes", json=c)
            print(f"Campagne '{c['nom']}' : {r.status_code}")
        except Exception as e: 
            print(f"Erreur campagne: {e}")

    # 2. Creer des leads
    leads = [
        {"nomContact": "Marwan Kiker", "entreprise": "MAKA Tech", "email": "marwan@maka.tech", "telephone": "0612345678", "source": "Site Web", "score": 85},
        {"nomContact": "Sara Mansouri", "entreprise": "Mansouri Consulting", "email": "sara@consulting.ma", "telephone": "0688776655", "source": "Recommandation", "score": 92},
        {"nomContact": "Kevin Durand", "entreprise": "Global Logistique", "email": "kevin@global.fr", "telephone": "+33611223344", "source": "Salon", "score": 45}
    ]
    for l in leads:
        try:
            r = requests.post("http://crm-service:5000/api/crm/leads", json=l)
            print(f"Lead '{l['nomContact']}' : {r.status_code}")
        except Exception as e:
            print(f"Erreur lead: {e}")

def seed_finance():
    print("Seeding Finance...")
    factures = [
        {
            "numero": "FAC-2024-001",
            "client": "Ifrane Academy",
            "montantTotal": 45000.0,
            "statut": "BROUILLON",
            "dateEcheance": "2024-06-15",
            "lignes": [{"description": "Audit Securite", "quantite": 1, "prixUnitaire": 45000.0}]
        },
        {
            "numero": "FAC-2024-002",
            "client": "Atlas Digital",
            "montantTotal": 12500.0,
            "statut": "VALIDEE",
            "dateEcheance": "2024-05-30",
            "lignes": [{"description": "Consulting Cloud", "quantite": 5, "prixUnitaire": 2500.0}]
        }
    ]
    for f in factures:
        try:
            r = requests.post("http://finance-service:6000/api/v1/factures", json=f)
            print(f"Facture '{f['numero']}' : {r.status_code}")
        except Exception as e:
            print(f"Erreur facture: {e}")

if __name__ == "__main__":
    # On attend que les services soient prets
    time.sleep(2)
    seed_crm()
    seed_finance()
    print("Seeding complete!")
