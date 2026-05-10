from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import ai_router, sales_router, leads_scrape_router, mcp_router
from app import config as app_config

# ============================================================
# Point d'entree principal — Sales & AI Service
# ============================================================

app = FastAPI(
    title="MAKA ERP — Sales & Intelligence",
    description="Service de gestion des ventes et module IA de MAKA ERP",
    version="2.0.0",
)

# CORS : la gateway Nginx gère en production. Pour appeler uvicorn directement (port 8004), ENABLE_CORS=1.
if app_config.ENABLE_CORS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# creer les tables au demarrage avec tentatives (car la DB met du temps a demarrer)
import time
for i in range(5):
    try:
        Base.metadata.create_all(bind=engine)
        print("Connexion base de donnees reussie !")
        break
    except Exception as e:
        print(f"Base de donnees indisponible ({e}), tentative {i+1}/5...")
        time.sleep(3)
else:
    print("La base de donnees n'a pas pu etre contactee.")

# generer les donnees de demonstration (si la base est vide)
try:
    from app.seed import generer_donnees_demo
    generer_donnees_demo()
except Exception as e:
    print(f"Seed data non genere: {e}")

# pre-entrainer le modele de lead scoring au demarrage
try:
    from app.ai.lead_scoring import entrainer_modele
    resultat = entrainer_modele()
    print(f"Modele Lead Scoring entraine (accuracy: {resultat['accuracy']}%)")
except Exception as e:
    print(f"Lead Scoring non entraine: {e}")

# enregistrer les routers
app.include_router(sales_router.router)
app.include_router(ai_router.router)
app.include_router(mcp_router.router)
app.include_router(leads_scrape_router.router)


@app.get("/")
def root():
    return {
        "service": "MAKA ERP — Sales & Intelligence",
        "version": "2.0.0",
        "modules_ia": {
            "chatbot_rag": "/api/sales/ai/chat",
            "lead_scoring": "/api/sales/ai/lead-score",
            "segmentation": "/api/sales/ai/segmentation",
            "forecast": "/api/sales/ai/forecast",
            "kpis": "/api/sales/ai/kpis",
            "insights": "/api/sales/ai/insights",
            "mcp_status": "/api/sales/ai/mcp/status",
        },
        "endpoints_ventes": {
            "produits": "/api/sales/produits",
            "devis": "/api/sales/devis",
            "commandes_vente": "/api/sales/commandes-vente",
            "commandes_achat": "/api/sales/commandes-achat",
            "documentation": "/docs",
        },
        "scraping_leads": {"google_scrape": "/api/leads/scrape"},
    }
