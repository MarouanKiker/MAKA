from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ============================================================
# Schemas Pydantic (DTOs) — Validation des donnees
# ============================================================

# --- Produit ---
class ProduitCreate(BaseModel):
    nom: str
    reference: str
    prix_vente: float = 0
    prix_achat: float = 0
    categorie: str = ""
    stock: int = 0

class ProduitOut(ProduitCreate):
    id: int
    class Config:
        from_attributes = True

# --- Devis ---
class DevisCreate(BaseModel):
    client: str
    montant_ht: float
    tva: float = 20.0

class DevisOut(BaseModel):
    id: int
    numero: str
    client: str
    montant_ht: float
    tva: float
    montant_ttc: float
    statut: str
    date_creation: datetime
    class Config:
        from_attributes = True

# --- Chat IA ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reponse: str
    source: str = "gemini"

# --- Forecast ---
class ForecastPoint(BaseModel):
    mois: str
    valeur: float
    type: str  # "reel" ou "prediction"

class ForecastResponse(BaseModel):
    donnees: list[ForecastPoint]
    tendance: str
    croissance: float

# --- KPI ---
class KpiResponse(BaseModel):
    ca_actuel: float
    ca_prevu: float
    croissance: float
    total_devis: int
    total_commandes: int
    taux_conversion: float

# --- Insight ---
class InsightItem(BaseModel):
    icone: str
    texte: str
    type: str  # "success", "warning", "info"
