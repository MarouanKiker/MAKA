# HR Service

Service de gestion des ressources humaines de MAKA ERP. Couvre l'administration du personnel, les contrats, les congés, les réclamations et la paie.

Statut : en cours de développement — prévu pour février 2026.

## Stack technique

- Java 17
- Spring Boot 3
- PostgreSQL 15 (Spring Data JPA)
- Flyway (migrations)

## Entités prévues

- `Employe` — informations personnelles, poste, département
- `Contrat` — type (CDI/CDD/Stage), dates, salaire
- `DemandeConge` — type, période, statut d'approbation
- `Reclamation` — description, statut, traitement
- `FicheDePaie` — calcul mensuel, cotisations, net à payer

## Endpoints prévus

| Méthode | Chemin                        | Description                     |
|---------|-------------------------------|---------------------------------|
| GET     | `/api/hr/employes`            | Lister les employés             |
| POST    | `/api/hr/employes`            | Créer un employé                |
| GET     | `/api/hr/conges`              | Lister les demandes de congé    |
| POST    | `/api/hr/conges`              | Soumettre une demande de congé  |
| PUT     | `/api/hr/conges/{id}/approve` | Approuver une demande           |
| GET     | `/api/hr/fiches-paie`         | Lister les fiches de paie       |

## Démarrage

```bash
mvn spring-boot:run
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
