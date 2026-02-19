# MAKA ERP

MAKA est un ERP modulaire basé sur une architecture microservices. Chaque domaine métier est un service indépendant qui communique via des API REST et des événements RabbitMQ, le tout routé par un API Gateway Nginx.

---

## Architecture

```
  Navigateur / Mobile
        │
        ▼
  ┌───────────┐       ┌─────────────────────────────────────────────────┐
  │  Frontend  │ ────▶ │              Nginx (API Gateway :80)            │
  │ Angular 17 │       └──┬────────┬────────┬────────┬────────┬─────────┘
  └───────────┘           │        │        │        │        │
                          ▼        ▼        ▼        ▼        ▼
                     auth:8001 crm:8002 stock:8003 sales:8004 hr:8005
                                                          finance:8006
                          │        │        │        │        │
                          └────────┴────────┴────────┴────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │  RabbitMQ :5672      │
                                │  (maka.events topic) │
                                └─────────────────────┘
```

---

## Services

| Service         | Technologie             | Base de données     | Port  |
|-----------------|-------------------------|---------------------|-------|
| Auth Service    | Symfony 7 / PHP 8.2     | MySQL 8             | 8001  |
| CRM Service     | .NET Core 8             | SQL Server 2022     | 8002  |
| Stock Service   | Symfony 7 / PHP 8.2     | MySQL 8             | 8003  |
| Sales Service   | Python FastAPI          | PostgreSQL 15       | 8004  |
| HR Service      | Java Spring Boot 3      | PostgreSQL 15       | 8005  |
| Finance Service | Java Spring Boot 3      | PostgreSQL 15       | 8006  |
| Frontend        | Angular 17+             | —                   | 4200  |
| API Gateway     | Nginx 1.25              | —                   | 80    |
| Message Broker  | RabbitMQ 3.13           | —                   | 5672  |

---

## Prérequis

- Docker 24+
- Docker Compose v2.20+

---

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/MarouanKiker/MAKA.git
cd MAKA

# 2. Copier le fichier d'environnement
cp .env.example .env
# Renseigner les variables dans .env

# 3. Démarrer tous les services
docker-compose up -d

# 4. Vérifier l'état des services
docker-compose ps
```

---

## URLs des services

| Service              | URL                           |
|----------------------|-------------------------------|
| Frontend             | http://localhost              |
| Auth API             | http://localhost/api/auth     |
| CRM API              | http://localhost/api/crm      |
| Stock API            | http://localhost/api/stock    |
| Sales API            | http://localhost/api/sales    |
| HR API               | http://localhost/api/hr       |
| Finance API          | http://localhost/api/finance  |
| RabbitMQ Management  | http://localhost:15672        |

---

## Communication inter-services

### REST (synchrone)

Tous les clients externes passent par Nginx sur le port 80. Chaque service expose une API REST sous `/api/<service>/`.

### RabbitMQ (asynchrone)

| Émetteur        | Clé de routage               | Consommateur(s)               |
|-----------------|------------------------------|-------------------------------|
| Sales Service   | `stock.commande.validee`     | Stock Service                 |
| Sales Service   | `finance.vente.conclue`      | Finance Service               |
| HR Service      | `finance.paie.calculee`      | Finance Service               |
| Stock Service   | `crm.stock.alerte`           | CRM Service                   |
| Finance Service | `ventes.paiement.recu`       | Sales Service                 |
| Stock Service   | `stock.rupture`              | CRM Service, Sales Service    |

Exchange : `maka.events` (type : topic)

---

## Structure du projet

```
MAKA/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── nginx/
│   └── default.conf
├── rabbitmq/
│   └── definitions.json
└── services/
    ├── auth-service/
    ├── crm-service/
    ├── stock-service/
    ├── sales-service/
    ├── hr-service/
    ├── finance-service/
    └── frontend/
```

---

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
