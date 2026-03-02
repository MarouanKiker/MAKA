#!/bin/bash
# =============================================================================
# Entrypoint : Génération automatique des clés RSA pour JWT
# Les clés sont stockées dans /var/www/html/config/jwt (volume partagé)
# =============================================================================

JWT_DIR="/var/www/html/config/jwt"
PASSPHRASE="${JWT_PASSPHRASE:-your_jwt_passphrase}"

# Créer le répertoire s'il n'existe pas
mkdir -p "$JWT_DIR"

# Générer les clés RSA UNIQUEMENT si elles n'existent pas déjà
if [ ! -f "$JWT_DIR/private.pem" ]; then
    echo ">>> Génération de la clé privée RSA (4096 bits)..."
    openssl genpkey -algorithm RSA -out "$JWT_DIR/private.pem" \
        -aes-256-cbc -pass "pass:$PASSPHRASE" \
        -pkeyopt rsa_keygen_bits:4096

    echo ">>> Extraction de la clé publique..."
    openssl pkey -in "$JWT_DIR/private.pem" \
        -passin "pass:$PASSPHRASE" \
        -pubout -out "$JWT_DIR/public.pem"

    # S'assurer que PHP-FPM peut lire les clés
    chmod 644 "$JWT_DIR/public.pem"
    chmod 600 "$JWT_DIR/private.pem"
    chown www-data:www-data "$JWT_DIR"/*.pem

    echo ">>> Clés JWT générées avec succès !"
else
    echo ">>> Clés JWT déjà présentes, skip."
fi

# Exécuter la commande passée en argument (php-fpm)
exec "$@"
