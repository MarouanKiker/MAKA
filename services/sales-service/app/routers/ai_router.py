import logging
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ChatRequest, LeadScoreRequest, LeadBatchRequest
from app.ai.chatbot import chat
from app.ai.forecaster import generer_forecast, generer_kpis, generer_insights
from app.ai.lead_scoring import entrainer_modele, scorer_lead, scorer_leads_batch
from app.ai.segmentation import segmenter_clients
from app.ai.marketing_intelligence import generer_marketing_intelligence
from app.ai.cross_analytics import generer_cross_analytics
from app import config as app_config
from app.config import GATEWAY_URL

logger = logging.getLogger(__name__)

# ============================================================
# Router IA — Endpoints pour le module MAKA Intelligence
# Inclut : Chatbot RAG++, Forecast, Lead Scoring, Segmentation,
#           Cross-Analytics (Score Sante, Alertes, KPIs globaux)
# ============================================================

router = APIRouter(prefix="/api/sales/ai", tags=["Intelligence IA"])


def _fallback_kpis() -> dict:
    return {
        "ca_actuel": 0,
        "ca_prevu": 0,
        "croissance": 0,
        "total_devis": 0,
        "total_commandes": 0,
        "taux_conversion": 0,
    }


def _fallback_cross_analytics() -> dict:
    return {
        "score_sante": 50,
        "niveau_sante": "Indisponible",
        "couleur_sante": "#64748b",
        "alertes": [
            {
                "type": "warning",
                "icone": "fa-triangle-exclamation",
                "titre": "Service IA en mode secours",
                "texte": "Les donnees avancees ne sont pas disponibles pour le moment.",
                "module": "IA",
            }
        ],
        "kpis": {
            "ca_total": 0,
            "ca_mensuel": 0,
            "croissance_ca": 0,
            "total_produits": 0,
            "total_devis": 0,
            "total_commandes": 0,
            "taux_conversion": 0,
            "devis_en_attente": 0,
            "total_leads": 0,
            "leads_nouveaux": 0,
            "leads_qualifies": 0,
            "pipeline_crm": 0,
            "opportunites": 0,
            "opps_gagnees": 0,
            "tasks_en_retard": 0,
            "tickets_ouverts": 0,
            "total_factures": 0,
            "factures_impayees": 0,
            "montant_impaye": 0,
            "total_employes": 0,
            "conges_en_cours": 0,
        },
        "modules_status": {
            "ventes": "indisponible",
            "crm": "indisponible",
            "finance": "indisponible",
            "rh": "indisponible",
        },
    }


@router.get("/data-sources")
def data_sources():
    """
    Routes utilisees par le module IA.
    Utile pour verifier que l'IA lit les memes APIs metier que le frontend.
    """
    gateway = GATEWAY_URL.rstrip("/")
    return {
        "frontend_ai_route": "/api/sales/ai",
        "chat_route": "/api/sales/ai/chat",
        "cross_analytics_route": "/api/sales/ai/cross-analytics",
        "forecast_route": "/api/sales/ai/forecast",
        "local_database": "sales-db via DATABASE_URL",
        "gateway_internal": gateway,
        "business_sources": {
            "crm": f"{gateway}/api/crm",
            "finance": f"{gateway}/api/finance",
            "hr": f"{gateway}/api/hr",
            "sales": "local SQLAlchemy session on sales-db",
        },
        "llm_status_route": "/api/sales/ai/llm-status",
    }


@router.get("/llm-status")
def llm_status():
    """
    Indique si un moteur LLM cloud est configure (sans exposer de secret).
    Sans GEMINI ni OpenRouter, le chatbot utilise le mode local (regles + BDD).
    """
    gemini = bool(app_config.GEMINI_API_KEY)
    openrouter = bool(app_config.OPENROUTER_API_KEY)
    if gemini:
        mode = "gemini"
    elif openrouter:
        mode = "openrouter"
    else:
        mode = "local"
    hint = (
        "Copilot LLM actif : le chatbot envoie le contexte RAG a Gemini ou OpenRouter."
        if mode != "local"
        else "Mode local : ajoutez GEMINI_API_KEY dans services/.env (voir .env.example), puis docker compose up -d sales-service."
    )
    return {
        "gemini_configured": gemini,
        "openrouter_configured": openrouter,
        "chat_mode": mode,
        "gateway_url": GATEWAY_URL.rstrip("/"),
        "setup_hint": hint,
    }


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
    try:
        return await generer_cross_analytics(db, token=token)
    except Exception as exc:
        logger.exception("Erreur cross-analytics IA: %s", exc)
        return _fallback_cross_analytics()


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
    try:
        return await chat(req.message, db, token=token)
    except Exception as exc:
        logger.exception("Erreur chatbot IA: %s", exc)
        return {
            "reponse": "Je suis en mode secours local. Le service IA a rencontre une erreur, mais l'application reste disponible.",
            "source": "local_fallback",
            "contexte_utilise": False,
        }


# --- FORECASTING ---

@router.get("/forecast")
def forecast(db: Session = Depends(get_db)):
    """prevision des ventes (Gradient Boosting sur donnees BDD)"""
    try:
        return generer_forecast(db)
    except Exception as exc:
        logger.exception("Erreur forecast IA: %s", exc)
        return {
            "erreur": "Forecast indisponible",
            "donnees": [],
            "tendance": "stable",
            "croissance": 0,
            "precision_modele": 0,
            "modele_utilise": "fallback",
        }


@router.get("/kpis")
def kpis(db: Session = Depends(get_db)):
    """KPI calcules dynamiquement depuis la BDD"""
    try:
        return generer_kpis(db)
    except Exception as exc:
        logger.exception("Erreur KPI IA: %s", exc)
        return _fallback_kpis()


@router.get("/insights")
def insights(db: Session = Depends(get_db)):
    """recommandations generees par analyse des donnees reelles"""
    try:
        return generer_insights(db)
    except Exception as exc:
        logger.exception("Erreur insights IA: %s", exc)
        return [
            {
                "icone": "fa-lightbulb",
                "texte": "Les insights IA sont temporairement indisponibles.",
                "type": "info",
            }
        ]


# --- LEAD SCORING (ML) ---

@router.post("/lead-score")
def lead_score(req: LeadScoreRequest):
    """
    Predit le score de conversion d'un lead (0 a 100).
    Utilise un RandomForest entraine sur l'historique.
    """
    try:
        return scorer_lead(
            source=req.source,
            nb_interactions=req.nb_interactions,
            anciennete_jours=req.anciennete_jours,
            montant_estime=req.montant_estime,
            priorite=req.priorite,
        )
    except Exception as exc:
        logger.exception("Erreur lead scoring IA: %s", exc)
        return {
            "score": 0,
            "niveau": "Indisponible",
            "probabilite_conversion": 0,
            "details": req.model_dump(),
        }


@router.post("/lead-score/batch")
def lead_score_batch(req: LeadBatchRequest):
    """score plusieurs leads d'un coup"""
    try:
        leads = [lead.model_dump() for lead in req.leads]
        return scorer_leads_batch(leads)
    except Exception as exc:
        logger.exception("Erreur batch lead scoring IA: %s", exc)
        return []


@router.post("/lead-score/train")
def train_model():
    """
    Re-entraine le modele de lead scoring.
    Retourne les metriques (accuracy, importance des features).
    """
    try:
        return entrainer_modele()
    except Exception as exc:
        logger.exception("Erreur entrainement lead scoring IA: %s", exc)
        return {
            "accuracy": 0,
            "nb_entrainement": 0,
            "nb_test": 0,
            "importances_features": {},
            "erreur": "Entrainement indisponible",
        }


# --- SEGMENTATION CLIENTS (K-MEANS) ---

@router.get("/marketing-intelligence")
async def marketing_intelligence(
    db: Session = Depends(get_db),
    maka_jwt: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """
    Customer Segmentation & Marketing Intelligence pour MAKA ERP.
    Agrege les commandes, devis et, si disponible, les leads CRM via Gateway.
    """
    token = maka_jwt
    if not token and authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    try:
        return await generer_marketing_intelligence(db, token=token)
    except Exception as exc:
        logger.exception("Erreur marketing intelligence IA: %s", exc)
        return {
            "erreur": "Marketing Intelligence indisponible",
            "summary": {},
            "segments": [],
            "customers": [],
            "recommendations": [],
            "modules_status": {"sales": "indisponible", "crm": "indisponible"},
        }


@router.get("/segmentation")
def segmentation(db: Session = Depends(get_db)):
    """
    Segmente automatiquement les clients en groupes (VIP, Regulier, etc.)
    avec K-Means clustering sur les donnees de ventes reelles.
    """
    try:
        return segmenter_clients(db)
    except Exception as exc:
        logger.exception("Erreur segmentation IA: %s", exc)
        return {
            "erreur": "Segmentation indisponible",
            "segments": [],
            "clients": [],
        }
