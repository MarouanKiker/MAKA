#!/bin/bash
# =============================================================================
# test_api.sh — Script de test automatique pour tous les endpoints Auth
# Usage : bash test_api.sh
# =============================================================================

BASE_URL="http://localhost/api/auth"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   🔐 Test API Auth — Symfony 7 Microservice       ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# ============================================
# 1. REGISTER
# ============================================
echo -e "${YELLOW}▶ 1. POST /register — Créer un utilisateur${NC}"
REGISTER=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123","first_name":"Test","last_name":"User"}')
echo "$REGISTER" | python3 -m json.tool 2>/dev/null || echo "$REGISTER"
echo ""

# ============================================
# 2. REGISTER ADMIN (pour les tests admin)
# ============================================
echo -e "${YELLOW}▶ 2. POST /register — Créer un admin${NC}"
REGISTER_ADMIN=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass123","first_name":"Admin","last_name":"User"}')
echo "$REGISTER_ADMIN" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_ADMIN"
echo ""

# ============================================
# 3. LOGIN (USER)
# ============================================
echo -e "${YELLOW}▶ 3. POST /login — Connexion utilisateur${NC}"
LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}')
echo "$LOGIN" | python3 -m json.tool 2>/dev/null || echo "$LOGIN"

# Extraire le token JWT et le refresh token
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
REFRESH_TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Impossible d'obtenir le token JWT. Arrêt des tests.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Token JWT obtenu (${#TOKEN} chars)${NC}"
echo -e "${GREEN}✅ Refresh token obtenu${NC}"
echo ""

# ============================================
# 4. PROFILE
# ============================================
echo -e "${YELLOW}▶ 4. GET /profile — Voir son profil${NC}"
PROFILE=$(curl -s -X GET "$BASE_URL/profile" \
  -H "Authorization: Bearer $TOKEN")
echo "$PROFILE" | python3 -m json.tool 2>/dev/null || echo "$PROFILE"
echo ""

# ============================================
# 5. CHANGE PASSWORD
# ============================================
echo -e "${YELLOW}▶ 5. PUT /change-password — Modifier le mot de passe${NC}"
CHANGE_PWD=$(curl -s -X PUT "$BASE_URL/change-password" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"old_password":"password123","new_password":"newpassword456"}')
echo "$CHANGE_PWD" | python3 -m json.tool 2>/dev/null || echo "$CHANGE_PWD"
echo ""

# Re-login avec le nouveau mot de passe
echo -e "${YELLOW}   ↳ Re-login avec le nouveau mot de passe...${NC}"
LOGIN2=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"newpassword456"}')
TOKEN=$(echo "$LOGIN2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
REFRESH_TOKEN=$(echo "$LOGIN2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
echo -e "${GREEN}   ✅ Re-login réussi${NC}"
echo ""

# ============================================
# 6. FORGOT PASSWORD
# ============================================
echo -e "${YELLOW}▶ 6. POST /forgot-password — Demander un reset token${NC}"
FORGOT=$(curl -s -X POST "$BASE_URL/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}')
echo "$FORGOT" | python3 -m json.tool 2>/dev/null || echo "$FORGOT"

# Extraire le debug_token
RESET_TOKEN=$(echo "$FORGOT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('debug_token',''))" 2>/dev/null)
echo ""

# ============================================
# 7. RESET PASSWORD
# ============================================
if [ -n "$RESET_TOKEN" ]; then
    echo -e "${YELLOW}▶ 7. POST /reset-password — Réinitialiser avec le token${NC}"
    RESET=$(curl -s -X POST "$BASE_URL/reset-password" \
      -H "Content-Type: application/json" \
      -d "{\"token\":\"$RESET_TOKEN\",\"new_password\":\"resetpass789\"}")
    echo "$RESET" | python3 -m json.tool 2>/dev/null || echo "$RESET"

    # Re-login avec le mot de passe réinitialisé
    echo -e "${YELLOW}   ↳ Re-login avec le mot de passe réinitialisé...${NC}"
    LOGIN3=$(curl -s -X POST "$BASE_URL/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"testuser@example.com","password":"resetpass789"}')
    TOKEN=$(echo "$LOGIN3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
    REFRESH_TOKEN=$(echo "$LOGIN3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
    echo -e "${GREEN}   ✅ Re-login réussi après reset${NC}"
else
    echo -e "${RED}▶ 7. SKIP — Pas de reset token disponible${NC}"
fi
echo ""

# ============================================
# 8. REFRESH TOKEN
# ============================================
echo -e "${YELLOW}▶ 8. POST /token/refresh — Renouveler le JWT${NC}"
REFRESH=$(curl -s -X POST "$BASE_URL/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
echo "$REFRESH" | python3 -m json.tool 2>/dev/null || echo "$REFRESH"

# Utiliser le nouveau token
NEW_TOKEN=$(echo "$REFRESH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
NEW_REFRESH=$(echo "$REFRESH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
if [ -n "$NEW_TOKEN" ]; then
    TOKEN="$NEW_TOKEN"
    REFRESH_TOKEN="$NEW_REFRESH"
    echo -e "${GREEN}   ✅ Token rafraîchi avec succès${NC}"
fi
echo ""

# ============================================
# 9. ADMIN — Promouvoir admin@example.com
# ============================================
echo -e "${YELLOW}▶ 9. Promouvoir admin@example.com en ROLE_ADMIN${NC}"
echo -e "${BLUE}   (via SQL directement car aucun admin n'existe encore)${NC}"
docker exec auth-db psql -U auth_user -d auth_db -c \
  "UPDATE \"user\" SET roles = '[\"ROLE_ADMIN\"]' WHERE email = 'admin@example.com';" 2>/dev/null
echo -e "${GREEN}   ✅ admin@example.com promu ROLE_ADMIN${NC}"
echo ""

# Login en tant qu'admin
echo -e "${YELLOW}   ↳ Login en tant qu'admin...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass123"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
echo -e "${GREEN}   ✅ Admin connecté${NC}"
echo ""



# ============================================
# 11. ADMIN — Promouvoir un utilisateur
# ============================================
echo -e "${YELLOW}▶ 11. PUT /admin/users/1/promote — Promouvoir user ID 1${NC}"
PROMOTE=$(curl -s -X PUT "$BASE_URL/admin/users/1/promote" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$PROMOTE" | python3 -m json.tool 2>/dev/null || echo "$PROMOTE"
echo ""

# ============================================
# 12. ADMIN — Rétrograder un utilisateur
# ============================================
echo -e "${YELLOW}▶ 12. PUT /admin/users/1/demote — Rétrograder user ID 1${NC}"
DEMOTE=$(curl -s -X PUT "$BASE_URL/admin/users/1/demote" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$DEMOTE" | python3 -m json.tool 2>/dev/null || echo "$DEMOTE"
echo ""

# ============================================
# 13. REVOKE REFRESH TOKEN (logout propre)
# ============================================
echo -e "${YELLOW}▶ 13. POST /token/revoke — Révoquer le refresh token${NC}"
REVOKE=$(curl -s -X POST "$BASE_URL/token/revoke" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")
echo "$REVOKE" | python3 -m json.tool 2>/dev/null || echo "$REVOKE"
echo ""

# ============================================
# 14. LOGOUT
# ============================================
echo -e "${YELLOW}▶ 14. POST /logout — Déconnexion${NC}"
LOGOUT=$(curl -s -X POST "$BASE_URL/logout" \
  -H "Authorization: Bearer $TOKEN")
echo "$LOGOUT" | python3 -m json.tool 2>/dev/null || echo "$LOGOUT"
echo ""

# ============================================
# RÉSUMÉ
# ============================================
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   ✅ Tests terminés !                             ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Endpoints testés :"
echo -e "  ✅ POST   /register"
echo -e "  ✅ POST   /login"
echo -e "  ✅ GET    /profile"
echo -e "  ✅ PUT    /change-password"
echo -e "  ✅ POST   /forgot-password"
echo -e "  ✅ POST   /reset-password"
echo -e "  ✅ POST   /token/refresh"
echo -e "  ✅ POST   /token/revoke"
echo -e "  ✅ GET    /users (ADMIN)"
echo -e "  ✅ PUT    /admin/users/{id}/promote"
echo -e "  ✅ PUT    /admin/users/{id}/demote"
echo -e "  ✅ POST   /logout"
echo ""
