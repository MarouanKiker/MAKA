from fastapi import FastAPI
from app.database import engine, Base
from app.routers import ai_router, sales_router

# ============================================================
# Point d'entree principal — Sales & AI Service
# ============================================================

app = FastAPI(
    title="MAKA ERP — Sales & Intelligence",
    description="Service de gestion des ventes et module IA de MAKA ERP",
    version="1.0.0",
)

# NOTE: Le middleware CORS est retire d'ici car la Gateway Nginx 
# s'en occupe deja (pour eviter l'erreur : The 'Access-Control-Allow-Origin' header contains multiple values)

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

# enregistrer les routers
app.include_router(sales_router.router)
app.include_router(ai_router.router)


@app.get("/")
def root():
    return {
        "service": "MAKA ERP — Sales & Intelligence",
        "version": "1.0.0",
        "endpoints": {
            "ventes": "/api/sales/",
            "intelligence_ia": "/api/sales/ai/",
            "documentation": "/docs"
        }
    }
