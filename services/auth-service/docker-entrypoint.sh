#!/bin/bash
# =============================================================================
# Entrypoint : Generation automatique des cles RSA pour JWT
# + migration DB + creation utilisateur admin
# =============================================================================

JWT_DIR="/var/www/html/config/jwt"
PASSPHRASE="${JWT_PASSPHRASE:-your_jwt_passphrase}"

# Creer le repertoire s'il n'existe pas
mkdir -p "$JWT_DIR"

# Generer les cles RSA UNIQUEMENT si elles n'existent pas deja
if [ ! -f "$JWT_DIR/private.pem" ]; then
    echo ">>> Generation de la cle privee RSA (2048 bits)..."
    openssl genpkey -algorithm RSA -out "$JWT_DIR/private.pem" \
        -aes-256-cbc -pass "pass:$PASSPHRASE" \
        -pkeyopt rsa_keygen_bits:2048

    echo ">>> Extraction de la cle publique..."
    openssl pkey -in "$JWT_DIR/private.pem" \
        -passin "pass:$PASSPHRASE" \
        -pubout -out "$JWT_DIR/public.pem"

    # S'assurer que PHP-FPM peut lire les cles
    chmod 644 "$JWT_DIR/public.pem"
    chmod 600 "$JWT_DIR/private.pem"
    chown www-data:www-data "$JWT_DIR"/*.pem

    echo ">>> Cles JWT generees avec succes !"
else
    echo ">>> Cles JWT deja presentes, skip."
fi

# Attendre que la base de donnees soit prete
echo ">>> Attente de la base de donnees..."
sleep 5

# Executer les migrations Doctrine (cree les tables)
if [ -f bin/console ]; then
    echo ">>> Creation du schema de base de donnees..."
    php bin/console doctrine:schema:update --force --no-interaction 2>/dev/null || true

    # Creer l'utilisateur admin par defaut s'il n'existe pas
    echo ">>> Verification de l'utilisateur admin..."
    php bin/console app:create-admin 2>/dev/null || echo ">>> Commande admin non disponible, skip."
fi

# Executer la commande passee en argument (php-fpm)
exec "$@"
