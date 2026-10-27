FROM php:8.3-alpine

WORKDIR /var/www

# Встановлення необхідних розширень (mbstring, gd, pdo_pgsql)
RUN apk add --no-cache \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    postgresql-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_pgsql

COPY . /var/www

EXPOSE 80

CMD ["php", "-S", "0.0.0.0:80", "-t", "/var/www/public"]
