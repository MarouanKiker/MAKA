from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

# ============================================================
# Modeles SQLAlchemy — Module Ventes & Achats
# ============================================================

class StatutDevis(str, enum.Enum):
    BROUILLON = "BROUILLON"
    ENVOYE = "ENVOYE"
    ACCEPTE = "ACCEPTE"
    REFUSE = "REFUSE"

class StatutCommande(str, enum.Enum):
    EN_COURS = "EN_COURS"
    LIVREE = "LIVREE"
    ANNULEE = "ANNULEE"

# --- Produit ---
class Produit(Base):
    __tablename__ = "produits"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(200), nullable=False)
    reference = Column(String(50), unique=True, nullable=False)
    prix_vente = Column(Float, default=0)
    prix_achat = Column(Float, default=0)
    categorie = Column(String(100), default="")
    stock = Column(Integer, default=0)

# --- Fournisseur ---
class Fournisseur(Base):
    __tablename__ = "fournisseurs"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(200), nullable=False)
    email = Column(String(200), default="")
    telephone = Column(String(20), default="")

# --- Devis ---
class Devis(Base):
    __tablename__ = "devis"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False)
    client = Column(String(200), nullable=False)
    montant_ht = Column(Float, default=0)
    tva = Column(Float, default=20.0)
    montant_ttc = Column(Float, default=0)
    statut = Column(String(20), default=StatutDevis.BROUILLON)
    date_creation = Column(DateTime, default=datetime.utcnow)

# --- Commande de vente ---
class CommandeVente(Base):
    __tablename__ = "commandes_vente"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False)
    client = Column(String(200), nullable=False)
    montant_ttc = Column(Float, default=0)
    statut = Column(String(20), default=StatutCommande.EN_COURS)
    date_creation = Column(DateTime, default=datetime.utcnow)
    devis_id = Column(Integer, nullable=True)

# --- Commande d'achat ---
class CommandeAchat(Base):
    __tablename__ = "commandes_achat"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False)
    fournisseur = Column(String(200), nullable=False)
    montant_ttc = Column(Float, default=0)
    statut = Column(String(20), default=StatutCommande.EN_COURS)
    date_creation = Column(DateTime, default=datetime.utcnow)

# --- Donnees de ventes mensuelles (pour les predictions IA) ---
class VenteMensuelle(Base):
    __tablename__ = "ventes_mensuelles"
    id = Column(Integer, primary_key=True, index=True)
    mois = Column(Integer, nullable=False)
    annee = Column(Integer, nullable=False)
    chiffre_affaires = Column(Float, default=0)
    nombre_ventes = Column(Integer, default=0)
