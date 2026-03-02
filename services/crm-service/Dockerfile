# =============================================================================
# Dockerfile - CRM Service (.NET 8 Web API)
# Optimisé pour le DÉVELOPPEMENT
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev

WORKDIR /app

# --- Copier le fichier projet et restaurer les packages ---
COPY *.csproj ./
RUN dotnet restore

# --- Copier le reste du code source ---
COPY . .

# --- Exposer le port Kestrel ---
EXPOSE 5000

# --- Lancer en mode watch pour le hot-reload en dev ---
CMD ["dotnet", "watch", "run", "--urls", "http://+:5000"]
