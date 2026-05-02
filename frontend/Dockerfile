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

# lancer le serveur de developpement Angular
# --host 0.0.0.0 permet d'acceder au serveur depuis l'exterieur du conteneur
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
