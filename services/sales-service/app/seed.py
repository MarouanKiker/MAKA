import numpy as np
import random
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Produit, Devis, CommandeVente, VenteMensuelle

# ============================================================
# Generateur de donnees de demonstration
# Cree des donnees realistes pour entrainer les modeles ML
# S'execute au demarrage si la base est vide
# ============================================================

# listes de noms realistes pour generer les donnees
NOMS_CLIENTS = [
    "TechnoMaroc SA", "Atlas Digital", "Casablanca Motors", "Rabat Solutions",
    "Tanger Logistique", "Marrakech Events", "Fes Consulting", "Agadir Trading",
    "Oujda Telecom", "Kenitra Industries", "Meknes Services", "Laayoune Energie",
    "Nador Import", "Tetouan Media", "Safi Agro", "El Jadida Construction",
    "Settat Finance", "Beni Mellal Tech", "Khouribga Mining", "Ifrane Academy",
]

NOMS_PRODUITS = [
    ("Pack Starter", "PS-001", 5000, 3000, "Services"),
    ("Pack Premium", "PP-002", 15000, 8000, "Services"),
    ("Pack Enterprise", "PE-003", 45000, 25000, "Services"),
    ("Consulting Jour", "CJ-004", 3500, 1500, "Consulting"),
    ("Formation 3 jours", "F3-005", 12000, 5000, "Formation"),
    ("Licence Annuelle", "LA-006", 8000, 2000, "Licence"),
    ("Support Premium", "SP-007", 6000, 1500, "Support"),
    ("Migration Cloud", "MC-008", 25000, 12000, "Cloud"),
    ("Audit Securite", "AS-009", 18000, 9000, "Securite"),
    ("Dev Sur Mesure", "DM-010", 35000, 18000, "Developpement"),
]

SOURCES_LEAD = ["Site Web", "LinkedIn", "Salon Pro", "Recommandation", "Cold Call", "Email"]


def generer_donnees_demo():
    """
    Genere des donnees de demo dans la base si elle est vide.
    Ces donnees servent a entrainer les modeles de ML.
    """
    db = SessionLocal()

    try:
        # verifier si la base contient deja des donnees
        if db.query(Produit).count() > 0:
            print("Base deja remplie, on passe la generation.")
            return

        print("Generation des donnees de demonstration...")

        # --- creer les produits ---
        for nom, ref, prix_vente, prix_achat, cat in NOMS_PRODUITS:
            produit = Produit(
                nom=nom,
                reference=ref,
                prix_vente=prix_vente,
                prix_achat=prix_achat,
                categorie=cat,
                stock=random.randint(5, 100),
            )
            db.add(produit)

        # --- creer des devis (historique de 6 mois) ---
        statuts_devis = ["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"]
        for i in range(40):
            client = random.choice(NOMS_CLIENTS)
            montant_ht = random.choice([5000, 8000, 12000, 15000, 25000, 35000, 45000])
            tva = 20.0
            montant_ttc = montant_ht * 1.2
            date = datetime.utcnow() - timedelta(days=random.randint(1, 180))

            devis = Devis(
                numero=f"DEV-{i+1:04d}",
                client=client,
                montant_ht=montant_ht,
                tva=tva,
                montant_ttc=montant_ttc,
                statut=random.choice(statuts_devis),
                date_creation=date,
            )
            db.add(devis)

        # --- creer des commandes de vente (a partir de devis acceptes) ---
        statuts_commande = ["EN_COURS", "LIVREE", "LIVREE", "LIVREE", "ANNULEE"]
        for i in range(25):
            client = random.choice(NOMS_CLIENTS)
            montant = random.choice([6000, 9600, 14400, 18000, 30000, 42000, 54000])
            date = datetime.utcnow() - timedelta(days=random.randint(1, 150))

            commande = CommandeVente(
                numero=f"CV-{i+1:04d}",
                client=client,
                montant_ttc=montant,
                statut=random.choice(statuts_commande),
                date_creation=date,
            )
            db.add(commande)

        # --- creer des ventes mensuelles (historique 18 mois pour le forecasting) ---
        base_ca = 150000
        for i in range(18):
            mois_offset = 17 - i
            date = datetime.utcnow() - timedelta(days=mois_offset * 30)
            mois = date.month
            annee = date.year

            # tendance croissante avec saisonnalite
            tendance = base_ca + (i * 8000)
            saisonnalite = 15000 * np.sin(2 * np.pi * mois / 12)
            bruit = random.uniform(-10000, 10000)
            ca = max(50000, tendance + saisonnalite + bruit)

            vente = VenteMensuelle(
                mois=mois,
                annee=annee,
                chiffre_affaires=round(ca, 2),
                nombre_ventes=random.randint(8, 35),
            )
            db.add(vente)

        db.commit()
        print(f"Donnees generees : 10 produits, 40 devis, 25 commandes, 18 mois de ventes")

    except Exception as e:
        db.rollback()
        print(f"Erreur generation donnees: {e}")
    finally:
        db.close()
