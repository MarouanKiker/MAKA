#!/bin/bash
# =============================================================================
# Entrypoint : G??n??ration automatique des cl??s RSA pour JWT
# Les cl??s sont stock??es dans /var/www/html/config/jwt (volume partag??)
# =============================================================================

JWT_DIR="/var/www/html/config/jwt"
PASSPHRASE="${JWT_PASSPHRASE:-your_jwt_passphrase}"

# Cr??er le r??pertoire s'il n'existe pas
mkdir -p "$JWT_DIR"

# G??n??rer les cl??s RSA UNIQUEMENT si elles n'existent pas d??j??
if [ ! -f "$JWT_DIR/private.pem" ]; then
    echo ">>> G??n??ration de la cl?? priv??e RSA (2048 bits)..."
    openssl genpkey -algorithm RSA -out "$JWT_DIR/private.pem" \
        -aes-256-cbc -pass "pass:$PASSPHRASE" \
        -pkeyopt rsa_keygen_bits:2048

    echo ">>> Extraction de la cl?? publique..."
    openssl pkey -in "$JWT_DIR/private.pem" \
        -passin "pass:$PASSPHRASE" \
        -pubout -out "$JWT_DIR/public.pem"

    # S'assurer que PHP-FPM peut lire les cl??s
    chmod 644 "$JWT_DIR/public.pem"
    chmod 600 "$JWT_DIR/private.pem"
    chown www-data:www-data "$JWT_DIR"/*.pem

    echo ">>> Cl??s JWT g??n??r??es avec succ??s !"
else
    echo ">>> Cl??s JWT d??j?? pr??sentes, skip."
fi

# Ex??cuter la commande pass??e en argument (php-fpm)
exec "$@"
