# Sales Service

Service de gestion des ventes et achats de MAKA ERP. Couvre les devis, commandes de vente, bons de livraison, factures ventes, commandes d'achat et réceptions fournisseurs.

Statut : en cours de développement — prévu pour mars 2026.

## Stack technique

- Python 3.11
- FastAPI
- PostgreSQL 15 (SQLAlchemy + Alembic)

## Modèles prévus

- `Devis` — devis client avec lignes de produits
- `CommandeVente` — commande confirmée depuis un devis
- `BonLivraison` — expédition liée à une commande vente
- `FactureVente` — facturation client
- `CommandeAchat` — commande fournisseur
- `BonReception` — réception marchandises
- `FactureAchat` — facture fournisseur
- `Produit` — catalogue produits avec prix de vente / achat
- `Fournisseur` — coordonnées et conditions

## Endpoints prévus

| Méthode | Chemin                    | Description                   |
|---------|---------------------------|-------------------------------|
| GET     | `/api/sales/devis`        | Lister les devis              |
| POST    | `/api/sales/devis`        | Créer un devis                |
| POST    | `/api/sales/devis/{id}/confirm` | Confirmer → commande    |
| GET     | `/api/sales/commandes`    | Lister les commandes vente    |
| GET     | `/api/sales/achats`       | Lister les commandes achat    |
| POST    | `/api/sales/achats`       | Créer une commande achat      |

## Démarrage

```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
