# Finance Service

Service de gestion financière et comptable de MAKA ERP. Couvre la facturation, les paiements, le journal des transactions, les comptes bancaires et le rapprochement bancaire.

Statut : en cours de développement — prévu pour avril 2026.

## Stack technique

- Java 17
- Spring Boot 3
- PostgreSQL 15 (Spring Data JPA)

## Entités prévues

- `Facture` — facture vente ou achat, statut de paiement
- `Paiement` — encaissement ou décaissement lié à une facture
- `JournalTransaction` — écriture comptable débit/crédit
- `CompteBancaire` — IBAN, solde, établissement
- `ModePaiement` — virement, chèque, carte, espèces
- `RapportFinancier` — bilan, compte de résultat, trésorerie

## Endpoints prévus

| Méthode | Chemin                        | Description                       |
|---------|-------------------------------|-----------------------------------|
| GET     | `/api/finance/factures`       | Lister les factures               |
| POST    | `/api/finance/factures`       | Créer une facture                 |
| POST    | `/api/finance/paiements`      | Enregistrer un paiement           |
| GET     | `/api/finance/journal`        | Consulter le journal comptable    |
| GET     | `/api/finance/rapports/bilan` | Générer le bilan                  |

## Démarrage

```bash
mvn spring-boot:run
```

## Équipe

- Maroun Kiker
- Abdelilah Hamdaoui
- Missaoui Abderahman
- Abdelah Ajebli
