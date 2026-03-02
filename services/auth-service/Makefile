# =============================================================================
# Makefile - Auth Service (Symfony 7)
# =============================================================================

DC = docker compose
CONTAINER = auth-service
DB = auth-db

GREEN  = \033[0;32m
YELLOW = \033[0;33m
RED    = \033[0;31m
CYAN   = \033[0;36m
NC     = \033[0m

.DEFAULT_GOAL := help

# =============================================================================
# AIDE
# =============================================================================

.PHONY: help
help: ## Afficher cette aide
	@echo ""
	@echo "$(CYAN)╔════════════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║        Auth Service - Commandes Make          ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# DÉMARRAGE
# =============================================================================

.PHONY: start stop restart

start: ## 🚀 Tout démarrer (build + up + wait + migrate + keys)
	@echo "$(CYAN)>>> Démarrage complet du Auth Service...$(NC)"
	@echo ""
	@echo "$(YELLOW)>>> 1/5 Build des images...$(NC)"
	cd .. && $(DC) build auth-service
	@echo ""
	@echo "$(YELLOW)>>> 2/5 Démarrage des conteneurs...$(NC)"
	cd .. && $(DC) up -d auth-service auth-db gateway
	@echo ""
	@echo "$(YELLOW)>>> 3/5 Attente de PostgreSQL (10s)...$(NC)"
	@sleep 10
	@echo ""
	@echo "$(YELLOW)>>> 4/5 Création/Mise à jour du schéma...$(NC)"
	cd .. && $(DC) exec $(CONTAINER) php bin/console doctrine:schema:update --force --no-interaction || true
	@echo ""
	@echo "$(YELLOW)>>> 5/5 Génération des clés JWT...$(NC)"
	cd .. && $(DC) exec $(CONTAINER) php bin/console lexik:jwt:generate-keypair --skip-if-exists 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║       Auth Service démarré avec succès !       ║$(NC)"
	@echo "$(GREEN)║                                                ║$(NC)"
	@echo "$(GREEN)║  Gateway  : http://localhost                   ║$(NC)"
	@echo "$(GREEN)║  Auth API : http://localhost/api/auth          ║$(NC)"
	@echo "$(GREEN)║                                                ║$(NC)"
	@echo "$(GREEN)║  Tester   : make test-all                     ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════╝$(NC)"

stop: ## Arrêter les services
	cd .. && $(DC) stop auth-service auth-db

restart: stop start ## Redémarrer tout

# =============================================================================
# BASE DE DONNÉES
# =============================================================================

.PHONY: db-create db-migrate db-update db-validate db-shell

db-create: ## Créer le schéma de la BDD
	cd .. && $(DC) exec $(CONTAINER) php bin/console doctrine:schema:create --no-interaction

db-migrate: ## Exécuter les migrations
	cd .. && $(DC) exec $(CONTAINER) php bin/console doctrine:migrations:migrate --no-interaction

db-update: ## Mettre à jour le schéma (dev)
	cd .. && $(DC) exec $(CONTAINER) php bin/console doctrine:schema:update --force

db-validate: ## Valider le schéma Doctrine
	cd .. && $(DC) exec $(CONTAINER) php bin/console doctrine:schema:validate

db-shell: ## Ouvrir psql dans le conteneur DB
	cd .. && $(DC) exec $(DB) psql -U auth_user -d auth_db

# =============================================================================
# SYMFONY
# =============================================================================

.PHONY: shell composer cache routes jwt-keys

shell: ## Ouvrir un shell dans le conteneur
	cd .. && $(DC) exec $(CONTAINER) bash

composer: ## Installer les dépendances Composer
	cd .. && $(DC) exec $(CONTAINER) composer install --no-interaction

cache: ## Vider le cache Symfony
	cd .. && $(DC) exec $(CONTAINER) php bin/console cache:clear

routes: ## Lister toutes les routes
	cd .. && $(DC) exec $(CONTAINER) php bin/console debug:router

jwt-keys: ## Régénérer les clés JWT
	@echo "$(RED)>>> Attention : cela invalide tous les tokens !$(NC)"
	cd .. && $(DC) exec $(CONTAINER) rm -f config/jwt/private.pem config/jwt/public.pem
	cd .. && $(DC) exec $(CONTAINER) php bin/console lexik:jwt:generate-keypair
	@echo "$(GREEN)>>> Nouvelles clés générées !$(NC)"

# =============================================================================
# LOGS
# =============================================================================

.PHONY: logs logs-db

logs: ## Logs du Auth Service
	cd .. && $(DC) logs -f $(CONTAINER)

logs-db: ## Logs de PostgreSQL
	cd .. && $(DC) logs -f $(DB)

# =============================================================================
# TESTS API
# =============================================================================

.PHONY: test-health test-register test-login test-profile test-all

test-health: ## GET /health
	@echo "$(CYAN)>>> GET /health$(NC)"
	@curl -s http://localhost/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost/health
	@echo ""

test-register: ## Inscrire un utilisateur test
	@echo "$(CYAN)>>> POST /api/auth/register$(NC)"
	@curl -s -X POST http://localhost/api/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"test@maka.com","password":"password123"}' \
		| python3 -m json.tool 2>/dev/null || echo "Erreur"
	@echo ""

test-login: ## Connecter l'utilisateur test
	@echo "$(CYAN)>>> POST /api/auth/login$(NC)"
	@curl -s -X POST http://localhost/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"test@maka.com","password":"password123"}' \
		| python3 -m json.tool 2>/dev/null || echo "Erreur"
	@echo ""

test-profile: ## Accéder au profil (auto-login)
	@echo "$(CYAN)>>> GET /api/auth/profile$(NC)"
	@TOKEN=$$(curl -s -X POST http://localhost/api/auth/login \
		-H "Content-Type: application/json" \
		-d '{"email":"test@maka.com","password":"password123"}' \
		| python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null) && \
	if [ -n "$$TOKEN" ]; then \
		curl -s http://localhost/api/auth/profile \
			-H "Authorization: Bearer $$TOKEN" \
			| python3 -m json.tool 2>/dev/null; \
	else \
		echo "$(RED)>>> Pas de token. Lancez 'make test-register' d'abord.$(NC)"; \
	fi
	@echo ""

test-all: test-health test-register test-login test-profile ## 🧪 Lancer tous les tests API

