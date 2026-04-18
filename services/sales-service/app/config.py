import os

# ============================================================
# Configuration du service Sales (variables d'environnement)
# ============================================================

# base de donnees PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sales_user:sales_pass@localhost:5432/sales_db"
)

# cle API Gemini (gratuit via Google AI Studio)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# chemin vers la cle publique JWT (volume Docker partage)
JWT_PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH", "/app/keys/public.pem")

# url de la gateway pour appeler les autres services
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://gateway:80")
