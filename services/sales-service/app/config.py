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

# cle API OpenRouter (optionnel)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# chemin vers la cle publique JWT (volume Docker partage)
JWT_PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH", "/app/keys/public.pem")

# url de la gateway pour appeler les autres services
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://gateway:80")

# url de connexion RabbitMQ (bus de messages entre microservices)
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://maka:maka_secret@localhost:5672/")

# MCP connectors optionnels pour email et agenda.
# Sans URL configuree, le service genere seulement des brouillons/propositions locaux.
MCP_EMAIL_CONNECTOR_URL = os.getenv("MCP_EMAIL_CONNECTOR_URL", "")
MCP_CALENDAR_CONNECTOR_URL = os.getenv("MCP_CALENDAR_CONNECTOR_URL", "")
MCP_CONNECTOR_TOKEN = os.getenv("MCP_CONNECTOR_TOKEN", "")
MCP_TIMEOUT_SECONDS = float(os.getenv("MCP_TIMEOUT_SECONDS", "8"))

# CORS direct (dev sans gateway) : ENABLE_CORS=1 + uvicorn sur le port local
ENABLE_CORS = os.getenv("ENABLE_CORS", "0") == "1"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if o.strip()]
