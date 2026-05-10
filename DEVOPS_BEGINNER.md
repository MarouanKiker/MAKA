# DevOps Beginner - MAKA ERP

Ce fichier resume les outils DevOps simples ajoutes au projet et les commandes utiles.

## 1. Outils utilises

- Git et GitHub : versionner le code.
- GitHub Actions : verifier automatiquement le projet a chaque push ou pull request.
- Docker : lancer les services dans des conteneurs.
- Docker Compose : demarrer tout le systeme avec une seule commande.

## 2. CI/CD GitHub Actions

Le workflow se trouve ici :

```text
.github/workflows/ci.yml
```

Il execute automatiquement :

- build Angular frontend
- build CRM .NET
- verification syntaxe Python du service Sales

Le pipeline se lance quand tu fais :

- `git push`
- une Pull Request vers `main` ou `master`

## 3. Commandes Git de base

```bash
git status
git add .
git commit -m "add lead generator pagination and devops ci"
git push
```

## 4. Lancer le projet avec Docker Compose

Depuis le dossier `services` :

```bash
cd services
docker compose up -d
```

Voir les conteneurs :

```bash
docker compose ps
```

Voir les logs :

```bash
docker compose logs -f
```

Voir les logs d'un service :

```bash
docker compose logs -f frontend
docker compose logs -f gateway
docker compose logs -f crm-service
docker compose logs -f sales-service
```

## 5. Rebuild apres modification

Frontend :

```bash
docker compose build frontend
docker compose up -d frontend
```

CRM :

```bash
docker compose build crm-service
docker compose up -d crm-service
```

Sales :

```bash
docker compose build sales-service
docker compose up -d sales-service
```

Tout rebuild :

```bash
docker compose build
docker compose up -d
```

## 6. Tests locaux avant push

Frontend :

```bash
cd frontend
npm install
npm run build
```

CRM :

```bash
cd services/crm-service
dotnet build
```

Sales :

```bash
cd services/sales-service
python -m compileall app
```

## 7. Workflow conseille pour debutant

1. Modifier le code.
2. Lancer les tests locaux.
3. Rebuild le service modifie.
4. Tester dans le navigateur.
5. Commit et push.
6. Verifier GitHub Actions.

## 8. URLs utiles en local

- Frontend : http://localhost:4200
- Gateway API : http://localhost:8000
- RabbitMQ UI : http://localhost:15672
- CRM direct : http://localhost:5000

