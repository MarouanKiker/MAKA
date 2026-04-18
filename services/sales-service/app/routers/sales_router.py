from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Produit, Devis
from app.schemas import ProduitCreate, ProduitOut, DevisCreate, DevisOut
from datetime import datetime

# ============================================================
# Router Ventes — Endpoints CRUD basiques
# ============================================================

router = APIRouter(prefix="/api/sales", tags=["Ventes & Achats"])


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


@router.get("/health")
def health():
    """health check du service sales"""
    return {"status": "ok", "service": "sales-service", "version": "1.0.0"}
