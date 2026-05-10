@echo off
setlocal enabledelayedexpansion

:: =============================================================================
:: make.bat - Hub & Spoke Microservices
:: Commandes simplifiees pour gerer le projet (Windows)
:: Usage: make.bat [commande]
:: =============================================================================

set DOCKER_COMPOSE=docker compose -f services\docker-compose.yml --project-directory services
set AUTH_CONTAINER=auth-service
set CRM_CONTAINER=crm-service
set AUTH_DB=auth-db
set CRM_DB=crm-db

set CMD=%1

if "%CMD%"=="" goto help
if "%CMD%"=="help" goto help

if "%CMD%"=="build"               goto build
if "%CMD%"=="up"                  goto up
if "%CMD%"=="up-logs"             goto up-logs
if "%CMD%"=="down"                goto down
if "%CMD%"=="restart"             goto restart
if "%CMD%"=="ps"                  goto ps
if "%CMD%"=="logs"                goto logs

if "%CMD%"=="logs-auth"           goto logs-auth
if "%CMD%"=="logs-crm"            goto logs-crm
if "%CMD%"=="logs-gateway"        goto logs-gateway
if "%CMD%"=="logs-auth-db"        goto logs-auth-db
if "%CMD%"=="logs-crm-db"         goto logs-crm-db

if "%CMD%"=="auth-shell"          goto auth-shell
if "%CMD%"=="auth-composer"       goto auth-composer
if "%CMD%"=="auth-cache"          goto auth-cache
if "%CMD%"=="auth-migrate"        goto auth-migrate
if "%CMD%"=="auth-migration"      goto auth-migration
if "%CMD%"=="auth-schema-create"  goto auth-schema-create
if "%CMD%"=="auth-schema-update"  goto auth-schema-update
if "%CMD%"=="auth-schema-validate" goto auth-schema-validate
if "%CMD%"=="auth-routes"         goto auth-routes
if "%CMD%"=="auth-jwt-keys"       goto auth-jwt-keys

if "%CMD%"=="crm-shell"           goto crm-shell
if "%CMD%"=="crm-build"           goto crm-build
if "%CMD%"=="crm-restore"         goto crm-restore

if "%CMD%"=="db-auth-shell"       goto db-auth-shell
if "%CMD%"=="db-crm-shell"        goto db-crm-shell

if "%CMD%"=="test-health"         goto test-health
if "%CMD%"=="test-register"       goto test-register
if "%CMD%"=="test-login"          goto test-login
if "%CMD%"=="test-profile"        goto test-profile
if "%CMD%"=="test-crm"            goto test-crm
if "%CMD%"=="test-all"            goto test-all

if "%CMD%"=="clean"               goto clean
if "%CMD%"=="clean-volumes"       goto clean-volumes
if "%CMD%"=="clean-all"           goto clean-all

if "%CMD%"=="init"                goto init

echo [ERROR] Commande inconnue: %CMD%
echo Lancez "make.bat help" pour voir les commandes disponibles.
exit /b 1

:: =============================================================================
:: AIDE
:: =============================================================================
:help
echo.
echo +============================================================+
echo ^|       Hub ^& Spoke Microservices - Commandes make.bat      ^|
echo +============================================================+
echo.
echo   DOCKER
echo   ------
echo   build                  Construire toutes les images Docker
echo   up                     Demarrer tous les services (mode detache)
echo   up-logs                Demarrer tous les services (avec logs)
echo   down                   Arreter tous les services
echo   restart                Redemarrer tous les services
echo   ps                     Afficher l'etat des conteneurs
echo   logs                   Afficher les logs de tous les services
echo.
echo   LOGS PAR SERVICE
echo   ----------------
echo   logs-auth              Logs du Auth Service (Symfony)
echo   logs-crm               Logs du CRM Service (.NET)
echo   logs-gateway           Logs du Gateway (Nginx)
echo   logs-auth-db           Logs de MySQL (Auth DB)
echo   logs-crm-db            Logs de PostgreSQL (CRM DB)
echo.
echo   AUTH SERVICE (Symfony)
echo   ----------------------
echo   auth-shell             Ouvrir un shell dans le conteneur Auth
echo   auth-composer          Installer les dependances Composer
echo   auth-cache             Vider le cache Symfony
echo   auth-migrate           Executer les migrations Doctrine
echo   auth-migration         Generer une nouvelle migration Doctrine
echo   auth-schema-create     Creer le schema de la base de donnees
echo   auth-schema-update     Mettre a jour le schema (dev uniquement)
echo   auth-schema-validate   Valider le schema Doctrine
echo   auth-routes            Lister les routes Symfony
echo   auth-jwt-keys          Regenerer les cles JWT
echo.
echo   CRM SERVICE (.NET)
echo   ------------------
echo   crm-shell              Ouvrir un shell dans le conteneur CRM
echo   crm-build              Compiler le projet .NET
echo   crm-restore            Restaurer les packages NuGet
echo.
echo   BASE DE DONNEES
echo   ---------------
echo   db-auth-shell          Ouvrir un client MySQL (Auth DB)
echo   db-crm-shell           Ouvrir un client PostgreSQL (CRM DB)
echo.
echo   TESTS API
echo   ---------
echo   test-health            Tester le health check du Gateway
echo   test-register          Inscrire un utilisateur de test
echo   test-login             Connecter l'utilisateur de test
echo   test-profile           Acceder au profil (necessite un token)
echo   test-crm               Acceder au CRM (necessite un token)
echo   test-all               Executer tous les tests API
echo.
echo   NETTOYAGE
echo   ---------
echo   clean                  Arreter les services et supprimer les conteneurs
echo   clean-volumes          Supprimer les volumes (perte de donnees!)
echo   clean-all              Tout supprimer (conteneurs + volumes + images)
echo.
echo   INITIALISATION
echo   --------------
echo   init                   Initialisation complete (build + start + schema)
echo.
goto end

:: =============================================================================
:: DOCKER
:: =============================================================================
:build
echo [INFO] Construction des images...
%DOCKER_COMPOSE% build
echo [OK] Images construites avec succes !
goto end

:up
echo [INFO] Demarrage des services...
%DOCKER_COMPOSE% up -d --build
echo [OK] Services demarres !
echo [INFO] Gateway accessible sur http://localhost
goto end

:up-logs
echo [INFO] Demarrage des services avec logs...
%DOCKER_COMPOSE% up --build
goto end

:down
echo [INFO] Arret des services...
%DOCKER_COMPOSE% down
echo [OK] Services arretes.
goto end

:restart
call %0 down
call %0 up
goto end

:ps
%DOCKER_COMPOSE% ps
goto end

:logs
%DOCKER_COMPOSE% logs -f
goto end

:: =============================================================================
:: LOGS PAR SERVICE
:: =============================================================================
:logs-auth
%DOCKER_COMPOSE% logs -f %AUTH_CONTAINER%
goto end

:logs-crm
%DOCKER_COMPOSE% logs -f %CRM_CONTAINER%
goto end

:logs-gateway
%DOCKER_COMPOSE% logs -f gateway
goto end

:logs-auth-db
%DOCKER_COMPOSE% logs -f %AUTH_DB%
goto end

:logs-crm-db
%DOCKER_COMPOSE% logs -f %CRM_DB%
goto end

:: =============================================================================
:: AUTH SERVICE
:: =============================================================================
:auth-shell
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% bash
goto end

:auth-composer
echo [INFO] Installation des dependances Composer...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% composer install --no-interaction
echo [OK] Dependances installees !
goto end

:auth-cache
echo [INFO] Vidage du cache Symfony...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console cache:clear
echo [OK] Cache vide !
goto end

:auth-migrate
echo [INFO] Execution des migrations...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console doctrine:migrations:migrate --no-interaction
echo [OK] Migrations executees !
goto end

:auth-migration
echo [INFO] Generation d'une migration...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console make:migration
echo [OK] Migration generee !
goto end

:auth-schema-create
echo [INFO] Creation du schema de la base...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console doctrine:schema:create
echo [OK] Schema cree !
goto end

:auth-schema-update
echo [INFO] Mise a jour du schema...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console doctrine:schema:update --force
echo [OK] Schema mis a jour !
goto end

:auth-schema-validate
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console doctrine:schema:validate
goto end

:auth-routes
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console debug:router
goto end

:auth-jwt-keys
echo [WARN] Attention : cela invalide tous les tokens existants !
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% rm -f config/jwt/private.pem config/jwt/public.pem
%DOCKER_COMPOSE% restart %AUTH_CONTAINER%
echo [OK] Nouvelles cles JWT generees !
goto end

:: =============================================================================
:: CRM SERVICE
:: =============================================================================
:crm-shell
%DOCKER_COMPOSE% exec %CRM_CONTAINER% bash
goto end

:crm-build
%DOCKER_COMPOSE% exec %CRM_CONTAINER% dotnet build
goto end

:crm-restore
%DOCKER_COMPOSE% exec %CRM_CONTAINER% dotnet restore
goto end

:: =============================================================================
:: BASE DE DONNEES
:: =============================================================================
:db-auth-shell
%DOCKER_COMPOSE% exec %AUTH_DB% mysql -u auth_user -pauth_pass auth_db
goto end

:db-crm-shell
%DOCKER_COMPOSE% exec %CRM_DB% psql -U crm_user -d crm_db
goto end

:: =============================================================================
:: TESTS API
:: =============================================================================
:test-health
echo [INFO] GET /health
curl -s http://localhost/health
echo.
goto end

:test-register
echo [INFO] POST /api/auth/register
curl -s -X POST http://localhost/api/auth/register ^
    -H "Content-Type: application/json" ^
    -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"
echo.
goto end

:test-login
echo [INFO] POST /api/auth/login
curl -s -X POST http://localhost/api/auth/login ^
    -H "Content-Type: application/json" ^
    -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"
echo.
goto end

:test-profile
echo [INFO] GET /api/auth/profile
echo [INFO] Recuperation du token...
for /f "delims=" %%T in ('curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}" ^| python -c "import sys,json; print(json.load(sys.stdin).get(\"token\",\"\"))"') do set TOKEN=%%T
if "!TOKEN!"=="" (
    echo [ERROR] Impossible d'obtenir le token. Lancez "make.bat test-register" d'abord.
) else (
    echo [OK] Token obtenu !
    curl -s http://localhost/api/auth/profile -H "Authorization: Bearer !TOKEN!"
)
echo.
goto end

:test-crm
echo [INFO] GET /api/crm/clients
echo [INFO] Recuperation du token...
for /f "delims=" %%T in ('curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}" ^| python -c "import sys,json; print(json.load(sys.stdin).get(\"token\",\"\"))"') do set TOKEN=%%T
if "!TOKEN!"=="" (
    echo [ERROR] Impossible d'obtenir le token. Lancez "make.bat test-register" d'abord.
) else (
    echo [OK] Token obtenu !
    curl -s http://localhost/api/crm/clients -H "Authorization: Bearer !TOKEN!"
)
echo.
goto end

:test-all
call %0 test-health
call %0 test-register
call %0 test-login
call %0 test-profile
call %0 test-crm
goto end

:: =============================================================================
:: NETTOYAGE
:: =============================================================================
:clean
echo [INFO] Nettoyage des conteneurs...
%DOCKER_COMPOSE% down --remove-orphans
echo [OK] Conteneurs supprimes.
goto end

:clean-volumes
echo [WARN] ATTENTION : Suppression des volumes (donnees perdues) !
%DOCKER_COMPOSE% down -v --remove-orphans
echo [OK] Volumes supprimes.
goto end

:clean-all
echo [WARN] ATTENTION : Suppression totale !
%DOCKER_COMPOSE% down -v --rmi all --remove-orphans
echo [OK] Tout a ete supprime.
goto end

:: =============================================================================
:: INITIALISATION
:: =============================================================================
:init
echo.
echo +============================================================+
echo ^|         Initialisation du projet Hub ^& Spoke             ^|
echo +============================================================+
echo.
echo [INFO] Etape 1/4 : Construction des images...
%DOCKER_COMPOSE% build
echo.
echo [INFO] Etape 2/4 : Demarrage des services...
%DOCKER_COMPOSE% up -d
echo.
echo [INFO] Etape 3/4 : Attente demarrage bases (~15s^)...
ping -n 17 127.0.0.1 >nul 2>&1
echo.
if not exist "services\auth-service\.env" (
    echo [INFO] Copie auth-service\.env.example vers .env ^(premiere fois^)...
    copy /y "services\auth-service\.env.example" "services\auth-service\.env" >nul
    if errorlevel 1 (
        echo [WARN] Impossible de creer .env — creez services\auth-service\.env manuellement.
    )
)
echo [INFO] Etape 4/4 : Creation du schema de la base Auth...
%DOCKER_COMPOSE% exec %AUTH_CONTAINER% php console doctrine:schema:create --no-interaction
if errorlevel 1 (
    echo [WARN] doctrine:schema:create a echoue ^(schema deja present ou .env manquant^).
    echo [INFO] Essayez : make.bat auth-migrate   ou verifiez services\auth-service\.env
)
echo.
echo +============================================================+
echo ^|           Projet initialise avec succes !                 ^|
echo +============================================================+
echo ^|  Gateway    : http://localhost                            ^|
echo ^|  Health     : http://localhost/health                     ^|
echo ^|  Auth API   : http://localhost/api/auth                   ^|
echo ^|  CRM API    : http://localhost/api/crm                    ^|
echo +------------------------------------------------------------+
echo ^|  Testez avec : make.bat test-all                          ^|
echo +============================================================+
echo.
goto end

:end
endlocal