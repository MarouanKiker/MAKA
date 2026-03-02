# 🐳 Docker Compose - Explication détaillée

## Vue d'ensemble

Le fichier `docker-compose.yml` orchestre **5 services** répartis sur **3 réseaux** avec **3 volumes** :

```
┌─────────────────────────────────────────────────────────┐
│                     hub-network                          │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Gateway  │    │ Auth Service │    │ CRM Service  │   │
│  │ (Nginx)  │    │ (Symfony)    │    │ (.NET 8)     │   │
│  │ Port: 80 │    │ Port: 9000   │    │ Port: 5000   │   │
│  └──────────┘    └──────┬───────┘    └──────┬───────┘   │
│                         │                    │           │
└─────────────────────────┼────────────────────┼───────────┘
                          │                    │
              ┌───────────┼──┐        ┌────────┼─────────┐
              │ auth-network │        │   crm-network    │
              │              │        │                  │
              │  ┌────────┐  │        │  ┌────────────┐  │
              │  │ MySQL  │  │        │  │ PostgreSQL │  │
              │  │  8.0   │  │        │  │    16      │  │
              │  └────────┘  │        │  └────────────┘  │
              └──────────────┘        └──────────────────┘
```

## Services détaillés

### 1. Gateway (Nginx)

```yaml
gateway:
    image: nginx:alpine
    container_name: gateway
    ports:
      - "80:80"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - auth-service
      - crm-service
    networks:
      - hub-network
```

| Propriété | Valeur | Explication |
|-----------|--------|-------------|
| `image` | `nginx:alpine` | Image légère (~5 MB) |
| `ports` | `80:80` | **Seul port exposé** à l'extérieur |
| `volumes` | `nginx.conf:ro` | Config montée en lecture seule |
| `depends_on` | auth, crm | Démarre après les services |
| `networks` | hub-network | Accès aux deux services |

### 2. Auth Service (Symfony)

```yaml
auth-service:
    build:
      context: ./auth-service
      dockerfile: Dockerfile
    container_name: auth-service
    volumes:
      - ./auth-service:/var/www/html
      - jwt-keys:/var/www/html/config/jwt
    environment:
      APP_ENV: dev
      DATABASE_URL: "mysql://auth_user:auth_pass@auth-db:3306/auth_db"
      JWT_PASSPHRASE: "your_jwt_passphrase"
    depends_on:
      - auth-db
    networks:
      - hub-network
      - auth-network
```

| Propriété | Explication |
|-----------|-------------|
| `build` | Construit l'image depuis le Dockerfile local |
| `volumes[0]` | Monte le code source pour le hot-reload en dev |
| `volumes[1]` | Volume partagé `jwt-keys` pour les clés RSA |
| `DATABASE_URL` | Connexion à MySQL via le réseau `auth-network` |
| `networks` | 2 réseaux : hub (Gateway) + auth (MySQL) |

### 3. CRM Service (.NET)

```yaml
crm-service:
    build:
      context: ./crm-service
      dockerfile: Dockerfile
    container_name: crm-service
    volumes:
      - jwt-keys:/app/keys:ro
    environment:
      ASPNETCORE_URLS: "http://+:5000"
      ConnectionStrings__DefaultConnection: "Host=crm-db;Port=5432;..."
    depends_on:
      - crm-db
    networks:
      - hub-network
      - crm-network
```

| Propriété | Explication |
|-----------|-------------|
| `volumes` | Volume `jwt-keys` en **lecture seule** (`:ro`) |
| `ASPNETCORE_URLS` | Kestrel écoute sur le port 5000 |
| `ConnectionStrings__` | Convention .NET pour les variables d'env |
| `networks` | 2 réseaux : hub (Gateway) + crm (PostgreSQL) |

### 4. Auth Database (MySQL)

```yaml
auth-db:
    image: mysql:8.0
    container_name: auth-db
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: auth_db
      MYSQL_USER: auth_user
      MYSQL_PASSWORD: auth_pass
    volumes:
      - auth-db-data:/var/lib/mysql
    networks:
      - auth-network
```

- Connecté **uniquement** au réseau `auth-network` → inaccessible depuis le Gateway ou le CRM
- Le volume `auth-db-data` persiste les données entre les redémarrages

### 5. CRM Database (PostgreSQL)

```yaml
crm-db:
    image: postgres:16-alpine
    container_name: crm-db
    environment:
      POSTGRES_DB: crm_db
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_pass
    volumes:
      - crm-db-data:/var/lib/postgresql/data
    networks:
      - crm-network
```

- Connecté **uniquement** au réseau `crm-network` → inaccessible depuis le Gateway ou le Auth Service
- Image `alpine` pour une taille réduite

## Volumes

```yaml
volumes:
  jwt-keys:        # Clés RSA partagées entre Auth et CRM
  auth-db-data:    # Données MySQL persistantes
  crm-db-data:     # Données PostgreSQL persistantes
```

| Volume | Utilisé par | Mode | Contenu |
|--------|------------|------|---------|
| `jwt-keys` | Auth (rw), CRM (ro) | Partagé | `private.pem`, `public.pem` |
| `auth-db-data` | auth-db | Persistant | Données MySQL |
| `crm-db-data` | crm-db | Persistant | Données PostgreSQL |

### Partage des clés JWT

```
Auth Service                    CRM Service
     │                               │
     │  jwt-keys:/var/www/html/      │  jwt-keys:/app/keys:ro
     │           config/jwt          │
     │                               │
     ├── private.pem (rw)            ├── private.pem (ro)
     └── public.pem  (rw)            └── public.pem  (ro)
```

Le CRM ne peut **que lire** les clés (`:ro`), il ne peut pas les modifier.

## Réseaux

```yaml
networks:
  hub-network:     # Gateway ↔ Services
    driver: bridge
  auth-network:    # Auth ↔ MySQL
    driver: bridge
  crm-network:     # CRM ↔ PostgreSQL
    driver: bridge
```

### Matrice de connectivité

| Service | hub-network | auth-network | crm-network |
|---------|:-----------:|:------------:|:-----------:|
| Gateway | ✅ | ❌ | ❌ |
| Auth Service | ✅ | ✅ | ❌ |
| CRM Service | ✅ | ❌ | ✅ |
| MySQL (auth-db) | ❌ | ✅ | ❌ |
| PostgreSQL (crm-db) | ❌ | ❌ | ✅ |

### Pourquoi cette isolation ?

1. **Sécurité** : Les bases de données ne sont pas accessibles depuis l'extérieur ni entre elles
2. **Principe du moindre privilège** : Chaque service n'a accès qu'aux ressources dont il a besoin
3. **Blast radius** : Si un service est compromis, l'attaquant ne peut pas accéder aux autres bases de données

## Commandes utiles

```bash
# Démarrer tous les services
docker-compose up --build

# Démarrer en arrière-plan
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f auth-service

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (reset complet)
docker-compose down -v

# Reconstruire un service spécifique
docker-compose build auth-service

# Exécuter une commande dans un conteneur
docker-compose exec auth-service php bin/console doctrine:migrations:migrate
docker-compose exec crm-db psql -U crm_user -d crm_db
```