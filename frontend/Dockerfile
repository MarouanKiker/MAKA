# =============================================================================
# Dockerfile - Frontend Angular 17 (mode developpement)
# Utilise ng serve pour le hot-reload en dev
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# copier les fichiers de dependances d'abord (pour profiter du cache Docker)
COPY package.json package-lock.json ./

# installer les dependances
RUN npm ci --quiet

# copier le reste du code source
COPY . .

# exposer le port Angular dev server
EXPOSE 4200

# Options host/port/poll dans angular.json (evite flags obsoletes type --disable-host-check).
CMD ["npx", "ng", "serve"]
