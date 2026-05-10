import os

# ============================================================
# Configuration du service Sales (variables d'environnement)
# ============================================================


def _clean_secret(value: str | None) -> str:
    """Nettoie BOM, retours chariot Windows (\r), espaces — souvent la cause de « clé invalide »."""
    if not value:
        return ""
    s = str(value).strip().lstrip("\ufeff")
    return s.replace("\r", "").replace("\n", "").strip()


# base de donnees PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sales_user:sales_pass@localhost:5432/sales_db"
)

# cle API Gemini (Google AI Studio : https://aistudio.google.com/apikey )
GEMINI_API_KEY = _clean_secret(os.getenv("GEMINI_API_KEY", ""))

# cle API OpenRouter (optionnel, fallback si Gemini indisponible)
OPENROUTER_API_KEY = _clean_secret(os.getenv("OPENROUTER_API_KEY", ""))

# chemin vers la cle publique JWT (volume Docker partage)
JWT_PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH", "/app/keys/public.pem")

# url de la gateway pour appeler les autres services (RAG cross-modules)
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://gateway:80")

# url de connexion RabbitMQ (bus de messages entre microservices)
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://maka:maka_secret@localhost:5672/")

# CORS direct (dev sans gateway) : ENABLE_CORS=1 + uvicorn sur le port local
ENABLE_CORS = os.getenv("ENABLE_CORS", "0") == "1"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if o.strip()]
