# 🌐 Gateway - Nginx Reverse Proxy

## Rôle

Le Gateway est le **point d'entrée unique** (Hub) de l'architecture. Il reçoit toutes les requêtes HTTP des clients et les **route** vers le microservice approprié.

## Fonctionnement

```
Client → http://localhost:80 → Nginx Gateway
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              /api/auth        /api/crm         /health
                    │               │               │
              FastCGI Pass    Proxy Pass       Réponse directe
              (port 9000)     (port 5000)      {"status":"ok"}
                    │               │
              Auth Service    CRM Service
              (PHP-FPM)       (.NET Kestrel)
```

## Configuration (`nginx.conf`)

### Upstreams

Les **upstreams** définissent les adresses des microservices en amont :

```nginx
upstream auth_service {
    server auth-service:9000;   # PHP-FPM (FastCGI)
}

upstream crm_service {
    server crm-service:5000;    # .NET Kestrel (HTTP)
}
```

- `auth-service` et `crm-service` sont les **noms des conteneurs Docker** (résolution DNS interne)
- PHP-FPM utilise le protocole **FastCGI** (port 9000), pas HTTP
- .NET Kestrel utilise le protocole **HTTP** standard (port 5000)

### Routes

#### `/api/auth` → Auth Service (FastCGI)

```nginx
location /api/auth {
    fastcgi_pass auth_service;
    fastcgi_param SCRIPT_FILENAME /var/www/html/public/index.php;
    fastcgi_param REQUEST_URI $request_uri;
    ...
}
```

- Utilise `fastcgi_pass` car PHP-FPM ne comprend pas HTTP directement
- Toutes les requêtes sont redirigées vers `index.php` (front controller Symfony)
- Symfony analyse ensuite le `REQUEST_URI` pour router vers le bon contrôleur

#### `/api/crm` → CRM Service (Proxy HTTP)

```nginx
location /api/crm {
    proxy_pass http://crm_service;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    ...
}
```

- Utilise `proxy_pass` car .NET Kestrel est un serveur HTTP classique
- Les headers `X-Real-IP` et `X-Forwarded-For` transmettent l'IP réelle du client
- `X-Forwarded-Proto` indique si la requête originale était en HTTP ou HTTPS

#### `/health` → Health Check

```nginx
location /health {
    return 200 '{"status": "gateway_ok"}';
    add_header Content-Type application/json;
}
```

- Endpoint simple pour vérifier que le Gateway est opérationnel
- Utile pour les orchestrateurs (Kubernetes, Docker Swarm) et le monitoring

### Réseau

Le Gateway est connecté uniquement au `hub-network`, ce qui lui permet de communiquer avec les deux services mais **pas** directement avec les bases de données.

## Ajouter un nouveau service

Pour ajouter un service (ex: Billing Service sur le port 3000) :

```nginx
# 1. Ajouter l'upstream
upstream billing_service {
    server billing-service:3000;
}

# 2. Ajouter la route dans le bloc server
location /api/billing {
    proxy_pass http://billing_service;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Fichier Docker Compose associé

```yaml
gateway:
    image: nginx:alpine
    container_name: gateway
    ports:
      - "80:80"                    # Seul port exposé à l'extérieur
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - auth-service
      - crm-service
    networks:
      - hub-network
```

- L'image `nginx:alpine` est légère (~5 MB)
- Le fichier de config est monté en **lecture seule** (`:ro`)
- `depends_on` assure que les services démarrent avant le Gateway