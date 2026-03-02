# 📊 CRM Service - .NET 8 Web API

## Rôle

Le CRM Service gère les données clients (Customer Relationship Management). Il est **protégé par JWT** : seuls les utilisateurs authentifiés via le Auth Service peuvent y accéder.

**Important** : Le CRM Service ne communique **jamais** avec le Auth Service par HTTP. Il valide les tokens JWT de manière autonome grâce à la **clé publique RSA** partagée via un volume Docker.

## Stack technique

| Composant | Technologie | Version |
|-----------|------------|---------|
| Framework | ASP.NET Core | 8.0 |
| Langage | C# | 12 |
| Serveur | Kestrel | intégré |
| ORM | Entity Framework Core | 8.0 |
| JWT | Microsoft.AspNetCore.Authentication.JwtBearer | 8.0 |
| Base de données | PostgreSQL | 16 |

## Architecture des fichiers

```
crm-service/
├── Dockerfile              # Image .NET SDK 8.0
├── CrmService.csproj       # Dépendances NuGet
├── Program.cs              # Configuration JWT + pipeline HTTP
├── appsettings.json        # Configuration de l'application
└── Controllers/
    └── CrmController.cs    # Endpoints CRM protégés par [Authorize]
```

## Flux d'accès

```
Client                    Nginx Gateway              CRM Service
  │                           │                         │
  │  GET /api/crm/clients     │                         │
  │  Authorization: Bearer eyJ│                         │
  │ ─────────────────────────►│                         │
  │                           │  proxy_pass             │
  │                           │────────────────────────►│
  │                           │                         │
  │                           │  1. Lire public.pem     │
  │                           │  2. Valider signature   │
  │                           │  3. Vérifier expiration │
  │                           │  4. Extraire les claims │
  │                           │                         │
  │                           │  200 OK                 │
  │                           │  {clients: [...]}       │
  │                           │◄────────────────────────│
  │  200 OK                   │                         │
  │ ◄─────────────────────────│                         │
```

## Configuration JWT (`Program.cs`)

### Chargement de la clé publique RSA

```csharp
var publicKeyPath = "/app/keys/public.pem";

// Attendre que la clé soit disponible (max 30 tentatives, 2s entre chaque)
RSA rsa = RSA.Create();
var publicKeyPem = File.ReadAllText(publicKeyPath);
rsa.ImportFromPem(publicKeyPem.ToCharArray());
var rsaSecurityKey = new RsaSecurityKey(rsa);
```

- Le chemin `/app/keys/public.pem` correspond au volume Docker `jwt-keys` monté en **lecture seule**
- Le service attend jusqu'à 60 secondes que la clé soit disponible (le Auth Service peut démarrer après)
- Seule la **clé publique** est nécessaire — le CRM ne peut **pas signer** de tokens

### Configuration du Bearer

```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,    // Vérifier la signature
            IssuerSigningKey = rsaSecurityKey,  // Avec la clé publique RSA
            ValidateIssuer = false,             // Désactivé en dev
            ValidateAudience = false,           // Désactivé en dev
            ValidateLifetime = true,            // Vérifier l'expiration
            ClockSkew = TimeSpan.FromMinutes(1) // Tolérance d'horloge
        };
    });
```

**Paramètres importants :**

| Paramètre | Valeur | Explication |
|-----------|--------|-------------|
| `ValidateIssuerSigningKey` | `true` | Vérifie que le token est signé avec la bonne clé |
| `IssuerSigningKey` | RSA public key | La clé publique du Auth Service |
| `ValidateIssuer` | `false` | En dev, on ne vérifie pas l'émetteur du token |
| `ValidateAudience` | `false` | En dev, on ne vérifie pas le destinataire |
| `ValidateLifetime` | `true` | Rejette les tokens expirés |
| `ClockSkew` | 1 minute | Tolérance pour le décalage d'horloge entre conteneurs |

> ⚠️ **En production**, il faut activer `ValidateIssuer` et `ValidateAudience` avec les valeurs appropriées.

### Pipeline HTTP

```csharp
app.UseAuthentication();  // 1. Vérifie le token JWT
app.UseAuthorization();   // 2. Vérifie les rôles/policies
app.MapControllers();     // 3. Route vers les contrôleurs
```

L'ordre est **crucial** : Authentication doit être **avant** Authorization.

## Contrôleur CRM (`CrmController.cs`)

### Attributs de classe

```csharp
[ApiController]
[Route("api/crm")]
[Authorize]          // Toutes les routes exigent un JWT valide
public class CrmController : ControllerBase
```

- `[ApiController]` : Active les fonctionnalités API (validation automatique, réponses 400, etc.)
- `[Route("api/crm")]` : Préfixe de toutes les routes
- `[Authorize]` : **Toutes** les méthodes de ce contrôleur nécessitent un token JWT valide

### Endpoints

#### `GET /api/crm/clients`

```csharp
[HttpGet("clients")]
public IActionResult GetClients()
```

- Retourne une liste fictive de clients (données de démonstration)
- Extrait l'email de l'utilisateur depuis les **claims** du JWT
- Réponse :
```json
{
    "message": "Accès autorisé au CRM",
    "authenticatedUser": "test@example.com",
    "data": [
        { "id": 1, "name": "Acme Corp", "contact": "john@acme.com" },
        { "id": 2, "name": "Globex Inc", "contact": "jane@globex.com" },
        { "id": 3, "name": "Initech", "contact": "bill@initech.com" }
    ]
}
```

#### `GET /api/crm/me`

```csharp
[HttpGet("me")]
public IActionResult GetCurrentUser()
```

- Retourne tous les **claims** extraits du token JWT (utile pour le debug)
- Réponse :
```json
{
    "message": "Informations extraites du token JWT",
    "claims": [
        { "type": "email", "value": "test@example.com" },
        { "type": "roles", "value": "ROLE_USER" },
        { "type": "exp", "value": "1708300800" }
    ]
}
```

## Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev

WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .

EXPOSE 5000
CMD ["dotnet", "watch", "run", "--urls", "http://+:5000"]
```

- Utilise l'image **SDK** (pas Runtime) pour le hot-reload en développement
- `dotnet watch run` : Recompile automatiquement à chaque modification du code
- Port 5000 exposé pour Kestrel

## Dépendances NuGet (`CrmService.csproj`)

| Package | Version | Utilisation |
|---------|---------|-------------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.0 | Validation des tokens JWT |
| `Microsoft.EntityFrameworkCore` | 8.0.0 | ORM pour accéder à PostgreSQL |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 8.0.0 | Provider PostgreSQL pour EF Core |
| `Microsoft.EntityFrameworkCore.Design` | 8.0.0 | Outils de migration (dev) |

## Docker Compose

```yaml
crm-service:
    build:
      context: ./crm-service
      dockerfile: Dockerfile
    container_name: crm-service
    volumes:
      - jwt-keys:/app/keys:ro          # Clé publique en lecture seule
    environment:
      ASPNETCORE_URLS: "http://+:5000"
      ConnectionStrings__DefaultConnection: "Host=crm-db;Port=5432;..."
    depends_on:
      - crm-db
    networks:
      - hub-network                     # Communication avec le Gateway
      - crm-network                     # Communication avec PostgreSQL
```

- Le volume `jwt-keys` est monté en **lecture seule** (`:ro`) — le CRM ne peut pas modifier les clés
- Le service est connecté à deux réseaux : `hub-network` (Gateway) et `crm-network` (PostgreSQL)

## Tester le service

```bash
# 1. D'abord, obtenir un token via le Auth Service
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.token')

# 2. Accéder aux clients CRM
curl http://localhost/api/crm/clients \
  -H "Authorization: Bearer $TOKEN"

# 3. Voir les informations du token
curl http://localhost/api/crm/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Test sans token (doit retourner 401)
curl http://localhost/api/crm/clients
# → 401 Unauthorized
```