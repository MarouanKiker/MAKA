# CRM Service

Service CRM de MAKA ERP. Gère les leads, opportunités, comptes, contacts, tickets support et campagnes marketing.

## Stack technique

- .NET Core 8
- SQL Server 2022 (Entity Framework Core)
- RabbitMQ.Client (événements asynchrones)
- Swagger / OpenAPI

## Endpoints

| Méthode | Chemin                              | Description                        |
|---------|-------------------------------------|------------------------------------|
| GET     | `/api/crm/leads`                    | Lister les leads                   |
| POST    | `/api/crm/leads`                    | Créer un lead                      |
| GET     | `/api/crm/leads/{id}`               | Détail d'un lead                   |
| PUT     | `/api/crm/leads/{id}`               | Modifier un lead                   |
| DELETE  | `/api/crm/leads/{id}`               | Supprimer un lead                  |
| POST    | `/api/crm/leads/{id}/qualify`       | Qualifier un lead                  |
| POST    | `/api/crm/leads/{id}/convert-to-opportunity` | Convertir en opportunité  |
| GET     | `/api/crm/opportunites/pipeline`    | Pipeline Kanban par statut         |
| GET     | `/api/crm/comptes`                  | Lister les comptes                 |
| GET     | `/api/crm/contacts`                 | Lister les contacts                |
| GET     | `/api/crm/tickets`                  | Lister les tickets                 |
| PUT     | `/api/crm/tickets/{id}/assign`      | Assigner un ticket                 |
| PUT     | `/api/crm/tickets/{id}/resolve`     | Résoudre un ticket                 |
| GET     | `/api/crm/campagnes`                | Lister les campagnes marketing     |

## Démarrage

```bash
dotnet restore
dotnet run --project src/Maka.CRM
```

La documentation Swagger est disponible sur `http://localhost:8002/swagger`.

## Variables d'environnement

| Variable                              | Description                     |
|---------------------------------------|---------------------------------|
| `ConnectionStrings__DefaultConnection`| Chaîne de connexion SQL Server  |
| `JWT__Secret`                         | Clé de signature JWT            |
| `RabbitMQ__Host`                      | Hôte RabbitMQ                   |
| `RabbitMQ__Username`                  | Utilisateur RabbitMQ            |
| `RabbitMQ__Password`                  | Mot de passe RabbitMQ           |

## Structure

```
crm-service/
├── src/Maka.CRM/
│   ├── Controllers/   # LeadController, OpportuniteController, etc.
│   ├── Data/          # CrmDbContext
│   ├── DTOs/          # LeadDto, OpportuniteDto
│   ├── Middleware/    # JwtValidationMiddleware
│   ├── Models/        # Lead, Opportunite, Compte, Contact, etc.
│   ├── Services/      # ILeadService, LeadService, RabbitMqPublisher
│   └── Program.cs
├── tests/Maka.CRM.Tests/
├── Dockerfile
└── Maka.CRM.sln
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
