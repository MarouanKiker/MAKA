FROM php:8.2-fpm AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl libpq-dev libzip-dev unzip \
    librabbitmq-dev libssl-dev \
    && docker-php-ext-install pdo pdo_mysql zip \
    && pecl install amqp \
    && docker-php-ext-enable amqp \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM base AS dev
COPY . .
RUN composer install --no-interaction --optimize-autoloader
EXPOSE 8001
CMD ["php", "-S", "0.0.0.0:8001", "-t", "public"]

FROM base AS prod
COPY . .
RUN composer install --no-dev --no-interaction --optimize-autoloader
RUN php bin/console cache:clear --env=prod --no-debug
EXPOSE 8001
CMD ["php-fpm"]
