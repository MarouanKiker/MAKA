# Stock Service

Service de gestion des stocks de MAKA ERP. Responsable de la gestion multi-dépôt, des mouvements de stock, des alertes de rupture et du suivi des fournisseurs.

Statut : en cours de développement — prévu pour mars 2026.

## Stack technique

- Symfony 7 / PHP 8.2
- MySQL 8.0 (Doctrine ORM)
- Symfony Messenger + RabbitMQ

## Entités prévues

- `Article` — référence produit, SKU, catégorie, prix unitaire
- `Depot` — localisation, capacité
- `Categorie` — arborescence de catégories d'articles
- `MouvementStock` — entrée, sortie, transfert inter-dépôt
- `EtatStock` — stock disponible, réservé, en commande par dépôt
- `Fournisseur` — coordonnées, délais, conditions tarifaires

## Endpoints prévus

| Méthode | Chemin                          | Description                        |
|---------|---------------------------------|------------------------------------|
| GET     | `/api/stock/articles`           | Lister les articles                |
| POST    | `/api/stock/articles`           | Créer un article                   |
| GET     | `/api/stock/mouvements`         | Historique des mouvements          |
| POST    | `/api/stock/mouvements`         | Enregistrer un mouvement           |
| GET     | `/api/stock/depots`             | Lister les dépôts                  |
| GET     | `/api/stock/alertes`            | Articles en rupture ou sous-seuil  |

## Démarrage

```bash
composer install
php bin/console doctrine:migrations:migrate
php -S 0.0.0.0:8003 -t public
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
