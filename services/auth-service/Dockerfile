# =============================================================================
# Dockerfile - Auth Service (Symfony 7 / PHP 8.3-FPM)
# Optimisé pour le DÉVELOPPEMENT
# =============================================================================

FROM php:8.3-fpm

# --- Dépendances système + extensions PHP ---
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libpq-dev \
    openssl \
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    intl \
    zip \
    opcache \
    && rm -rf /var/lib/apt/lists/*

# --- Composer ---
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# --- Copier les fichiers du projet ---
COPY . .

# --- Installer les dépendances PHP (si composer.json existe) ---
RUN if [ -f composer.json ]; then \
    composer install --no-interaction --optimize-autoloader; \
    fi

# --- Script d'entrypoint : génère les clés JWT si absentes ---
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# PHP-FPM écoute sur le port 9000 par défaut
EXPOSE 9000
CMD ["php-fpm"]
