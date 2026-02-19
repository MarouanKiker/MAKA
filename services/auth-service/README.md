# Auth Service

Service d'authentification et d'autorisation de MAKA ERP. Gère l'inscription, la connexion, l'émission/renouvellement/révocation des tokens JWT et le contrôle d'accès par rôles.

## Stack technique

- Symfony 7 / PHP 8.2
- MySQL 8.0 (Doctrine ORM)
- LexikJWTAuthenticationBundle (RS256)
- Symfony Messenger + RabbitMQ (AMQP)
- NelmioCorsBundle

## Endpoints

| Méthode | Chemin                | Description                       | Auth requise  |
|---------|-----------------------|-----------------------------------|---------------|
| POST    | `/api/auth/login`     | Authentifier un utilisateur       | Non           |
| POST    | `/api/auth/register`  | Créer un compte                   | Non           |
| POST    | `/api/auth/refresh`   | Renouveler le token d'accès       | Non           |
| POST    | `/api/auth/logout`    | Révoquer le refresh token         | Non           |
| GET     | `/api/users`          | Lister les utilisateurs           | ROLE_ADMIN    |
| GET     | `/api/users/{id}`     | Récupérer un utilisateur          | ROLE_ADMIN    |
| PUT     | `/api/users/{id}`     | Modifier un utilisateur           | ROLE_ADMIN    |
| DELETE  | `/api/users/{id}`     | Supprimer un utilisateur          | ROLE_ADMIN    |

## Démarrage

```bash
composer install

# Générer les clés JWT
mkdir -p config/jwt
openssl genrsa -out config/jwt/private.pem -aes256 4096
openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem

# Migrations
php bin/console doctrine:migrations:migrate

# Serveur de développement
php -S 0.0.0.0:8001 -t public
```

## Variables d'environnement

| Variable                  | Description                          |
|---------------------------|--------------------------------------|
| `DATABASE_URL`            | Chaîne de connexion MySQL            |
| `JWT_SECRET_KEY`          | Chemin vers la clé RSA privée        |
| `JWT_PUBLIC_KEY`          | Chemin vers la clé RSA publique      |
| `JWT_PASSPHRASE`          | Passphrase de la clé privée          |
| `MESSENGER_TRANSPORT_DSN` | Connexion RabbitMQ (AMQP)            |

## Structure

```
auth-service/
├── src/
│   ├── Controller/    # AuthController, UserController
│   ├── DTO/           # LoginRequest, RegisterRequest, TokenResponse
│   ├── Entity/        # User, RefreshToken
│   ├── EventListener/ # JwtCreatedListener
│   ├── Repository/    # UserRepository, RefreshTokenRepository
│   ├── Security/      # JwtAuthenticator
│   └── Service/       # AuthService, JwtService
├── config/packages/
├── tests/
├── Dockerfile
└── composer.json
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
