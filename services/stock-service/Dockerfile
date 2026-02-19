FROM php:8.2-fpm AS base
RUN apt-get update && apt-get install -y git curl libzip-dev unzip librabbitmq-dev \
    && docker-php-ext-install pdo pdo_mysql zip \
    && pecl install amqp && docker-php-ext-enable amqp \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --no-interaction --optimize-autoloader 2>/dev/null || true
EXPOSE 8003
CMD ["php", "-S", "0.0.0.0:8003", "-t", "public"]
