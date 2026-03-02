# 🔐 Auth Service - Symfony 7 + LexikJWT

## Rôle

Le Auth Service est responsable de :
- **L'inscription** des utilisateurs (`POST /api/auth/register`)
- **L'authentification** via email/mot de passe (`POST /api/auth/login`)
- **La génération de tokens JWT** signés avec une clé privée RSA
- **La consultation du profil** de l'utilisateur connecté (`GET /api/auth/profile`)

## Stack technique

| Composant | Technologie | Version |
|-----------|------------|---------|
| Framework | Symfony | 7.x |
| Langage | PHP | 8.3 |
| Serveur | PHP-FPM | 8.3 |
| ORM | Doctrine | 3.x |
| JWT | LexikJWTAuthenticationBundle | 3.x |
| Base de données | MySQL | 8.0 |

## Architecture des fichiers

```
auth-service/
├── Dockerfile                  # Image PHP 8.3-FPM avec extensions
├── docker-entrypoint.sh        # Script de génération des clés RSA
├── composer.json               # Dépendances PHP
├── .env                        # Variables d'environnement
├── public/
│   └── index.php               # Front controller Symfony
├── config/
│   ├── jwt/                    # Clés RSA (volume Docker partagé)
│   │   ├── private.pem         # Clé privée (signature des tokens)
│   │   └── public.pem          # Clé publique (vérification)
│   └── packages/
│       ├── security.yaml       # Firewalls + providers + access control
│       └── lexik_jwt_authentication.yaml  # Config LexikJWT
└── src/
    ├── Entity/
    │   └── User.php            # Entité Doctrine (table `user`)
    └── Controller/
        └── AuthController.php  # Endpoints register + profile
```

## Flux d'authentification

### 1. Inscription (`POST /api/auth/register`)

```
Client                    Auth Service                MySQL
  │                           │                         │
  │  POST /api/auth/register  │                         │
  │  {email, password}        │                         │
  │ ─────────────────────────►│                         │
  │                           │  Hash du mot de passe   │
  │                           │  (bcrypt/argon2)        │
  │                           │                         │
  │                           │  INSERT INTO user       │
  │                           │────────────────────────►│
  │                           │                         │
  │  201 Created              │                         │
  │  {message, user}          │                         │
  │ ◄─────────────────────────│                         │
```

### 2. Connexion (`POST /api/auth/login`)

```
Client                    Auth Service                MySQL
  │                           │                         │
  │  POST /api/auth/login     │                         │
  │  {email, password}        │                         │
  │ ─────────────────────────►│                         │
  │                           │  SELECT * FROM user     │
  │                           │  WHERE email = ?        │
  │                           │────────────────────────►│
  │                           │◄────────────────────────│
  │                           │                         │
  │                           │  Vérification password  │
  │                           │  Génération JWT         │
  │                           │  (signé avec private.pem)│
  │                           │                         │
  │  200 OK                   │                         │
  │  {token: "eyJ..."}        │                         │
  │ ◄─────────────────────────│                         │
```

### 3. Accès protégé (`GET /api/auth/profile`)

```
Client                    Auth Service
  │                           │
  │  GET /api/auth/profile    │
  │  Authorization: Bearer eyJ│
  │ ─────────────────────────►│
  │                           │  Validation du JWT
  │                           │  (avec public.pem)
  │                           │
  │  200 OK                   │
  │  {id, email, roles}       │
  │ ◄─────────────────────────│
```

## Configuration Security (`security.yaml`)

### Password Hashers

```yaml
password_hashers:
    Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'
```

- `auto` sélectionne automatiquement le meilleur algorithme (bcrypt ou argon2id)
- Le hash est stocké dans la colonne `password` de la table `user`

### User Provider

```yaml
providers:
    app_user_provider:
        entity:
            class: App\Entity\User
            property: email
```

- Symfony charge l'utilisateur depuis la base de données via Doctrine
- L'identifiant unique est l'**email** (pas le username)
- L'entité `App\Entity\User` doit implémenter `UserInterface` et `PasswordAuthenticatedUserInterface`

### Firewalls

```yaml
firewalls:
    login:
        pattern: ^/api/auth/login
        stateless: true
        json_login:
            check_path: /api/auth/login
            success_handler: lexik_jwt_authentication.handler.authentication_success
            failure_handler: lexik_jwt_authentication.handler.authentication_failure

    api:
        pattern: ^/api/auth
        stateless: true
        jwt: ~
```

- **login** : Accepte les requêtes POST avec `{email, password}` en JSON. LexikJWT génère le token en cas de succès.
- **api** : Toutes les autres routes `/api/auth/*` exigent un token JWT valide dans le header `Authorization`.
- `stateless: true` signifie qu'il n'y a **pas de session PHP** — chaque requête est indépendante.

### Access Control

```yaml
access_control:
    - { path: ^/api/auth/login, roles: PUBLIC_ACCESS }
    - { path: ^/api/auth/register, roles: PUBLIC_ACCESS }
    - { path: ^/api/auth, roles: IS_AUTHENTICATED_FULLY }
```

- `/api/auth/login` et `/api/auth/register` sont **publics** (pas de token requis)
- Toutes les autres routes `/api/auth/*` nécessitent une **authentification complète**

## Configuration LexikJWT (`lexik_jwt_authentication.yaml`)

```yaml
lexik_jwt_authentication:
    secret_key: '%kernel.project_dir%/config/jwt/private.pem'
    public_key: '%kernel.project_dir%/config/jwt/public.pem'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: 3600
    user_identity_field: email
```

- **secret_key** : Clé privée RSA pour **signer** les tokens
- **public_key** : Clé publique RSA pour **vérifier** les tokens
- **pass_phrase** : Mot de passe de la clé privée (chiffrée AES-256-CBC)
- **token_ttl** : Durée de vie du token = 3600 secondes (1 heure)
- **user_identity_field** : Le champ `email` est inclus dans le payload du JWT

## Entité User (`src/Entity/User.php`)

L'entité User est **nécessaire** car :
1. `security.yaml` référence `App\Entity\User` comme provider
2. Doctrine ORM a besoin d'une entité pour mapper la table `user` en MySQL
3. LexikJWT utilise le `UserInterface` pour extraire les informations du token

L'entité implémente :
- `UserInterface` : méthodes `getRoles()`, `getUserIdentifier()`, `eraseCredentials()`
- `PasswordAuthenticatedUserInterface` : méthode `getPassword()`

## Dockerfile

```dockerfile
FROM php:8.3-fpm

# Extensions PHP nécessaires
RUN docker-php-ext-install pdo_mysql intl zip opcache

# Composer pour les dépendances
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Entrypoint : génère les clés RSA si absentes
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
```

- **pdo_mysql** : Connexion à MySQL via Doctrine
- **intl** : Internationalisation (requis par Symfony)
- **zip** : Extraction des packages Composer
- **opcache** : Cache du bytecode PHP (performance)

## Script d'entrypoint (`docker-entrypoint.sh`)

```bash
# Génère les clés RSA 4096 bits si elles n'existent pas
openssl genpkey -algorithm RSA -out private.pem -aes-256-cbc -pass "pass:$PASSPHRASE" -pkeyopt rsa_keygen_bits:4096
openssl pkey -in private.pem -passin "pass:$PASSPHRASE" -pubout -out public.pem
```

- Les clés sont stockées dans `/var/www/html/config/jwt/` (volume Docker `jwt-keys`)
- La clé publique est partagée avec le CRM Service via le même volume
- Les permissions sont configurées : `private.pem` (600), `public.pem` (644)

## Tester le service

```bash
# 1. Inscription
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 2. Connexion
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
# → {"token": "eyJ..."}

# 3. Profil (avec le token)
curl http://localhost/api/auth/profile \
  -H "Authorization: Bearer eyJ..."
```