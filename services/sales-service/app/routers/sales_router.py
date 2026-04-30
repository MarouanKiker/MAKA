from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Produit, Devis, CommandeVente, CommandeAchat, Fournisseur
from app.schemas import ProduitCreate, ProduitOut, DevisCreate, DevisOut
from app.messaging import notifier_vente_conclue
from datetime import datetime

# ============================================================
# Router Ventes — Endpoints CRUD + publication RabbitMQ
# ============================================================

router = APIRouter(prefix="/api/sales", tags=["Ventes & Achats"])


# --- PRODUITS ---

@router.get("/produits")
def lister_produits(db: Session = Depends(get_db)):
    """lister tous les produits"""
    return db.query(Produit).all()


@router.post("/produits")
def creer_produit(data: ProduitCreate, db: Session = Depends(get_db)):
    """creer un nouveau produit"""
    produit = Produit(**data.model_dump())
    db.add(produit)
    db.commit()
    db.refresh(produit)
    return produit


# --- DEVIS ---

@router.get("/devis")
def lister_devis(db: Session = Depends(get_db)):
    """lister tous les devis"""
    return db.query(Devis).all()


@router.post("/devis")
def creer_devis(data: DevisCreate, db: Session = Depends(get_db)):
    """creer un nouveau devis"""
    # generer un numero automatique
    count = db.query(Devis).count()
    numero = f"DEV-{count + 1:04d}"
    montant_ttc = data.montant_ht * (1 + data.tva / 100)

    devis = Devis(
        numero=numero,
        client=data.client,
        montant_ht=data.montant_ht,
        tva=data.tva,
        montant_ttc=round(montant_ttc, 2),
    )
    db.add(devis)
    db.commit()
    db.refresh(devis)
    return devis


# --- COMMANDES DE VENTE ---

@router.get("/commandes-vente")
def lister_commandes_vente(db: Session = Depends(get_db)):
    """lister toutes les commandes de vente"""
    return db.query(CommandeVente).all()


@router.post("/commandes-vente")
def creer_commande_vente(client: str, montant_ttc: float, devis_id: int = None, db: Session = Depends(get_db)):
    """
    creer une commande de vente
    quand la commande est creee, on envoie un message a RabbitMQ
    pour que le service Finance cree automatiquement la facture
    """
    # generer un numero automatique
    count = db.query(CommandeVente).count()
    numero = f"CV-{count + 1:04d}"

    commande = CommandeVente(
        numero=numero,
        client=client,
        montant_ttc=montant_ttc,
        devis_id=devis_id,
    )
    db.add(commande)
    db.commit()
    db.refresh(commande)

    # envoyer un message a RabbitMQ pour notifier Finance
    notifier_vente_conclue(
        numero_commande=commande.numero,
        client=commande.client,
        montant_ttc=commande.montant_ttc,
    )

    return commande


# --- COMMANDES D'ACHAT ---

@router.get("/commandes-achat")
def lister_commandes_achat(db: Session = Depends(get_db)):
    """lister toutes les commandes d'achat"""
    return db.query(CommandeAchat).all()


@router.post("/commandes-achat")
def creer_commande_achat(fournisseur: str, montant_ttc: float, db: Session = Depends(get_db)):
    """creer une commande d'achat"""
    count = db.query(CommandeAchat).count()
    numero = f"CA-{count + 1:04d}"

    commande = CommandeAchat(
        numero=numero,
        fournisseur=fournisseur,
        montant_ttc=montant_ttc,
    )
    db.add(commande)
    db.commit()
    db.refresh(commande)
    return commande


# --- FOURNISSEURS ---

@router.get("/fournisseurs")
def lister_fournisseurs(db: Session = Depends(get_db)):
    """lister tous les fournisseurs"""
    return db.query(Fournisseur).all()


@router.post("/fournisseurs")
def creer_fournisseur(nom: str, email: str = "", telephone: str = "", db: Session = Depends(get_db)):
    """creer un fournisseur"""
    fournisseur = Fournisseur(nom=nom, email=email, telephone=telephone)
    db.add(fournisseur)
    db.commit()
    db.refresh(fournisseur)
    return fournisseur


# --- HEALTH CHECK ---

@router.get("/health")
def health():
    """health check du service sales"""
    return {"status": "ok", "service": "sales-service", "version": "1.0.0"}
