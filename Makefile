# =============================================================================
# Makefile - Hub & Spoke Microservices
# Commandes simplifiées pour gérer le projet
# =============================================================================

# Variables
DOCKER_COMPOSE = docker-compose
AUTH_CONTAINER = auth-service
CRM_CONTAINER  = crm-service
AUTH_DB        = auth-db
CRM_DB         = crm-db

# Couleurs pour l'affichage
GREEN  = \033[0;32m
YELLOW = \033[0;33m
RED    = \033[0;31m
CYAN   = \033[0;36m
NC     = \033[0m  # No Color

# =============================================================================
# AIDE
# =============================================================================

.PHONY: help
help: ## Afficher cette aide
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║       Hub & Spoke Microservices - Commandes Make        ║$(NC)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""

.DEFAULT_GOAL := help

# =============================================================================
# DOCKER - Gestion des conteneurs
# =============================================================================

.PHONY: build up down restart ps logs

build: ## Construire toutes les images Docker
	@echo "$(YELLOW)>>> Construction des images...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)>>> Images construites avec succès !$(NC)"

up: ## Démarrer tous les services (mode détaché)
	@echo "$(YELLOW)>>> Démarrage des services...$(NC)"
	$(DOCKER_COMPOSE) up -d --build
	@echo "$(GREEN)>>> Services démarrés !$(NC)"
	@echo "$(CYAN)>>> Gateway accessible sur http://localhost$(NC)"

up-logs: ## Démarrer tous les services (avec logs en temps réel)
	@echo "$(YELLOW)>>> Démarrage des services avec logs...$(NC)"
	$(DOCKER_COMPOSE) up --build

down: ## Arrêter tous les services
	@echo "$(YELLOW)>>> Arrêt des services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)>>> Services arrêtés.$(NC)"

restart: down up ## Redémarrer tous les services

ps: ## Afficher l'état des conteneurs
	$(DOCKER_COMPOSE) ps

logs: ## Afficher les logs de tous les services
	$(DOCKER_COMPOSE) logs -f

# =============================================================================
# LOGS PAR SERVICE
# =============================================================================

.PHONY: logs-auth logs-crm logs-gateway logs-auth-db logs-crm-db

logs-auth: ## Logs du Auth Service (Symfony)
	$(DOCKER_COMPOSE) logs -f $(AUTH_CONTAINER)

logs-crm: ## Logs du CRM Service (.NET)
	$(DOCKER_COMPOSE) logs -f $(CRM_CONTAINER)

logs-gateway: ## Logs du Gateway (Nginx)
	$(DOCKER_COMPOSE) logs -f gateway

logs-auth-db: ## Logs de MySQL (Auth DB)
	$(DOCKER_COMPOSE) logs -f $(AUTH_DB)

logs-crm-db: ## Logs de PostgreSQL (CRM DB)
	$(DOCKER_COMPOSE) logs -f $(CRM_DB)

# =============================================================================
# AUTH SERVICE - Commandes Symfony
# =============================================================================

.PHONY: auth-shell auth-composer auth-cache auth-migrate auth-migration auth-schema auth-routes

auth-shell: ## Ouvrir un shell dans le conteneur Auth
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) bash

auth-composer: ## Installer les dépendances Composer
	@echo "$(YELLOW)>>> Installation des dépendances Composer...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) composer install --no-interaction
	@echo "$(GREEN)>>> Dépendances installées !$(NC)"

auth-cache: ## Vider le cache Symfony
	@echo "$(YELLOW)>>> Vidage du cache Symfony...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console cache:clear
	@echo "$(GREEN)>>> Cache vidé !$(NC)"

auth-migrate: ## Exécuter les migrations Doctrine
	@echo "$(YELLOW)>>> Exécution des migrations...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console doctrine:migrations:migrate --no-interaction
	@echo "$(GREEN)>>> Migrations exécutées !$(NC)"

auth-migration: ## Générer une nouvelle migration Doctrine
	@echo "$(YELLOW)>>> Génération d'une migration...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console make:migration
	@echo "$(GREEN)>>> Migration générée !$(NC)"

auth-schema-create: ## Créer le schéma de la base de données (première fois)
	@echo "$(YELLOW)>>> Création du schéma de la base...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console doctrine:schema:create
	@echo "$(GREEN)>>> Schéma créé !$(NC)"

auth-schema-update: ## Mettre à jour le schéma (dev uniquement)
	@echo "$(YELLOW)>>> Mise à jour du schéma...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console doctrine:schema:update --force
	@echo "$(GREEN)>>> Schéma mis à jour !$(NC)"

auth-schema-validate: ## Valider le schéma Doctrine
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console doctrine:schema:validate

auth-routes: ## Lister les routes Symfony
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console debug:router

auth-jwt-keys: ## Régénérer les clés JWT (supprime les anciennes)
	@echo "$(RED)>>> Attention : cela invalide tous les tokens existants !$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) rm -f config/jwt/private.pem config/jwt/public.pem
	$(DOCKER_COMPOSE) restart $(AUTH_CONTAINER)
	@echo "$(GREEN)>>> Nouvelles clés JWT générées !$(NC)"

# =============================================================================
# CRM SERVICE - Commandes .NET
# =============================================================================

.PHONY: crm-shell crm-build crm-restore

crm-shell: ## Ouvrir un shell dans le conteneur CRM
	$(DOCKER_COMPOSE) exec $(CRM_CONTAINER) bash

crm-build: ## Compiler le projet .NET
	$(DOCKER_COMPOSE) exec $(CRM_CONTAINER) dotnet build

crm-restore: ## Restaurer les packages NuGet
	$(DOCKER_COMPOSE) exec $(CRM_CONTAINER) dotnet restore

# =============================================================================
# BASE DE DONNÉES
# =============================================================================

.PHONY: db-auth-shell db-crm-shell

db-auth-shell: ## Ouvrir un client MySQL (Auth DB)
	$(DOCKER_COMPOSE) exec $(AUTH_DB) mysql -u auth_user -pauth_pass auth_db

db-crm-shell: ## Ouvrir un client PostgreSQL (CRM DB)
	$(DOCKER_COMPOSE) exec $(CRM_DB) psql -U crm_user -d crm_db

# =============================================================================
# TESTS API - Commandes curl pour tester les endpoints
# =============================================================================

.PHONY: test-health test-register test-login test-profile test-crm test-all

test-health: ## Tester le health check du Gateway
	@echo "$(CYAN)>>> GET /health$(NC)"
	@curl -s http://localhost/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost/health
	@echo ""

test-register: ## Inscrire un utilisateur de test
	@echo "$(CYAN)>>> POST /api/auth/register$(NC)"
	@curl -s -X POST http://localhost/api/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email": "test@example.com", "password": "password123"}' \
		| python3 -m json.tool 2>/dev/null || echo "Erreur de connexion"
	@echo ""

test-login: ## Connecter l'utilisateur de test et afficher le token
	@echo "$(CYAN)>>> POST /api/auth/login$(NC)"
	@curl -s -X POST http://localhost/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email": "test@example.com", "password": "password123"}' \
		| python3 -m json.tool 2>/dev/null || echo "Erreur de connexion"
	@echo ""

test-profile: ## Accéder au profil (nécessite un token - lancer test-login d'abord)
	@echo "$(CYAN)>>> GET /api/auth/profile$(NC)"
	@echo "$(YELLOW)>>> Récupération du token...$(NC)"
	@TOKEN=$$(curl -s -X POST http://localhost/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email": "test@example.com", "password": "password123"}' \
		| python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null) && \
	if [ -n "$$TOKEN" ]; then \
		echo "$(GREEN)>>> Token obtenu !$(NC)" && \
		curl -s http://localhost/api/auth/profile \
			-H "Authorization: Bearer $$TOKEN" \
			| python3 -m json.tool 2>/dev/null; \
	else \
		echo "$(RED)>>> Impossible d'obtenir le token. Lancez 'make test-register' d'abord.$(NC)"; \
	fi
	@echo ""

test-crm: ## Accéder au CRM (nécessite un token)
	@echo "$(CYAN)>>> GET /api/crm/clients$(NC)"
	@echo "$(YELLOW)>>> Récupération du token...$(NC)"
	@TOKEN=$$(curl -s -X POST http://localhost/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email": "test@example.com", "password": "password123"}' \
		| python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null) && \
	if [ -n "$$TOKEN" ]; then \
		echo "$(GREEN)>>> Token obtenu !$(NC)" && \
		curl -s http://localhost/api/crm/clients \
			-H "Authorization: Bearer $$TOKEN" \
			| python3 -m json.tool 2>/dev/null; \
	else \
		echo "$(RED)>>> Impossible d'obtenir le token. Lancez 'make test-register' d'abord.$(NC)"; \
	fi
	@echo ""

test-all: test-health test-register test-login test-profile test-crm ## Exécuter tous les tests API

# =============================================================================
# NETTOYAGE
# =============================================================================

.PHONY: clean clean-all clean-volumes

clean: ## Arrêter les services et supprimer les conteneurs
	@echo "$(YELLOW)>>> Nettoyage des conteneurs...$(NC)"
	$(DOCKER_COMPOSE) down --remove-orphans
	@echo "$(GREEN)>>> Conteneurs supprimés.$(NC)"

clean-volumes: ## Supprimer les volumes (⚠️ perte de données)
	@echo "$(RED)>>> ATTENTION : Suppression des volumes (données perdues) !$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)>>> Volumes supprimés.$(NC)"

clean-all: ## Tout supprimer (conteneurs + volumes + images)
	@echo "$(RED)>>> ATTENTION : Suppression totale !$(NC)"
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	@echo "$(GREEN)>>> Tout a été supprimé.$(NC)"

# =============================================================================
# INITIALISATION - Premier lancement
# =============================================================================

.PHONY: init

init: ## 🚀 Initialisation complète (build + start + schema)
	@echo "$(CYAN)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║          Initialisation du projet Hub & Spoke           ║$(NC)"
	@echo "$(CYAN)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)>>> Étape 1/4 : Construction des images...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo ""
	@echo "$(YELLOW)>>> Étape 2/4 : Démarrage des services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "$(YELLOW)>>> Étape 3/4 : Attente du démarrage de MySQL (15s)...$(NC)"
	@sleep 15
	@echo ""
	@echo "$(YELLOW)>>> Étape 4/4 : Création du schéma de la base Auth...$(NC)"
	$(DOCKER_COMPOSE) exec $(AUTH_CONTAINER) php bin/console doctrine:schema:create --no-interaction || true
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║              Projet initialisé avec succès !            ║$(NC)"
	@echo "$(GREEN)╠══════════════════════════════════════════════════════════╣$(NC)"
	@echo "$(GREEN)║  Gateway    : http://localhost                          ║$(NC)"
	@echo "$(GREEN)║  Health     : http://localhost/health                   ║$(NC)"
	@echo "$(GREEN)║  Auth API   : http://localhost/api/auth                 ║$(NC)"
	@echo "$(GREEN)║  CRM API    : http://localhost/api/crm                  ║$(NC)"
	@echo "$(GREEN)╠══════════════════════════════════════════════════════════╣$(NC)"
	@echo "$(GREEN)║  Testez avec : make test-all                            ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════╝$(NC)"