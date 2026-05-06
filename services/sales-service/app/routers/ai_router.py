from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, LeadScoreRequest, LeadBatchRequest
from app.ai.chatbot import chat
from app.ai.forecaster import generer_forecast, generer_kpis, generer_insights
from app.ai.lead_scoring import entrainer_modele, scorer_lead, scorer_leads_batch
from app.ai.segmentation import segmenter_clients
from app.ai.cross_analytics import generer_cross_analytics

# ============================================================
# Router IA — Endpoints pour le module MAKA Intelligence
# Inclut : Chatbot RAG++, Forecast, Lead Scoring, Segmentation,
#           Cross-Analytics (Score Sante, Alertes, KPIs globaux)
# ============================================================

router = APIRouter(prefix="/api/sales/ai", tags=["Intelligence IA"])


# --- CROSS-ANALYTICS (Centre de Commandement) ---

@router.get("/cross-analytics")
async def cross_analytics(
    db: Session = Depends(get_db),
    maka_jwt: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """
    Rapport cross-modules : score de sante, alertes intelligentes,
    KPIs agreges de CRM + Finance + RH + Ventes.
    """
    token = maka_jwt
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    return await generer_cross_analytics(db, token=token)


# --- CHATBOT RAG++ ---

@router.post("/chat")
async def chatbot(
    req: ChatRequest,
    db: Session = Depends(get_db),
    maka_jwt: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """chatbot IA avec RAG++ — interroge TOUS les modules puis repond avec les vrais chiffres"""
    token = maka_jwt
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    result = await chat(req.message, db, token=token)
    return result


# --- FORECASTING ---

@router.get("/forecast")
def forecast(db: Session = Depends(get_db)):
    """prevision des ventes (Gradient Boosting sur donnees BDD)"""
    return generer_forecast(db)


@router.get("/kpis")
def kpis(db: Session = Depends(get_db)):
    """KPI calcules dynamiquement depuis la BDD"""
    return generer_kpis(db)


@router.get("/insights")
def insights(db: Session = Depends(get_db)):
    """recommandations generees par analyse des donnees reelles"""
    return generer_insights(db)


# --- LEAD SCORING (ML) ---

@router.post("/lead-score")
def lead_score(req: LeadScoreRequest):
    """
    Predit le score de conversion d'un lead (0 a 100).
    Utilise un RandomForest entraine sur l'historique.
    """
    return scorer_lead(
        source=req.source,
        nb_interactions=req.nb_interactions,
        anciennete_jours=req.anciennete_jours,
        montant_estime=req.montant_estime,
        priorite=req.priorite,
    )


@router.post("/lead-score/batch")
def lead_score_batch(req: LeadBatchRequest):
    """score plusieurs leads d'un coup"""
    leads = [lead.model_dump() for lead in req.leads]
    return scorer_leads_batch(leads)


@router.post("/lead-score/train")
def train_model():
    """
    Re-entraine le modele de lead scoring.
    Retourne les metriques (accuracy, importance des features).
    """
    return entrainer_modele()


# --- SEGMENTATION CLIENTS (K-MEANS) ---

@router.get("/segmentation")
def segmentation(db: Session = Depends(get_db)):
    """
    Segmente automatiquement les clients en groupes (VIP, Regulier, etc.)
    avec K-Means clustering sur les donnees de ventes reelles.
    """
    return segmenter_clients(db)
