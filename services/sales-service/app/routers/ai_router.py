from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse
from app.ai.chatbot import chat
from app.ai.forecaster import generer_forecast, generer_kpis, generer_insights

# ============================================================
# Router IA — Endpoints pour le module MAKA Intelligence
# ============================================================

router = APIRouter(prefix="/api/sales/ai", tags=["Intelligence IA"])


@router.post("/chat")
async def chatbot(req: ChatRequest):
    """chatbot IA — pose une question sur l'ERP"""
    result = await chat(req.message)
    return result


@router.get("/forecast")
async def forecast():
    """prevision des ventes (regression lineaire)"""
    return generer_forecast()


@router.get("/kpis")
async def kpis():
    """KPI intelligents avec predictions"""
    return generer_kpis()


@router.get("/insights")
async def insights():
    """recommandations et insights generes par l'IA"""
    return generer_insights()
