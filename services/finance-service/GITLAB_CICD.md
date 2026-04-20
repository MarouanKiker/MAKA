# GitLab CI/CD - Finance Service

## Pipeline inclus
Le pipeline défini dans [.gitlab-ci.yml](.gitlab-ci.yml) contient :

1. `unit_test` : tests Maven avec service PostgreSQL
2. `package_jar` : packaging du JAR Spring Boot
3. `build_and_push_image` : build et push de l'image Docker vers le GitLab Container Registry
4. `deploy_staging` : déploiement manuel vers l'environnement staging (`develop`)
5. `deploy_production` : déploiement manuel vers production (tags)

## Variables GitLab CI/CD à configurer
Dans **Settings > CI/CD > Variables** :

### Obligatoires
- `SSH_PRIVATE_KEY` (masked/protected)
- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_DB_URL`
- `STAGING_DB_USERNAME`
- `STAGING_DB_PASSWORD`
- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_DB_URL`
- `PROD_DB_USERNAME`
- `PROD_DB_PASSWORD`

### Déjà fournies par GitLab (registry)
- `CI_REGISTRY`
- `CI_REGISTRY_IMAGE`
- `CI_REGISTRY_USER`
- `CI_REGISTRY_PASSWORD`

## Règles de déclenchement
- Push sur une branche : test + package + image
- Branche `develop` : job `deploy_staging` disponible en manuel
- Tag Git : job `deploy_production` disponible en manuel

## Exécution
1. Push le code sur GitLab
2. Vérifier que le pipeline passe jusqu'à `build_and_push_image`
3. Déclencher `deploy_staging` (manuel)
4. Vérifier le service déployé sur le serveur staging
5. Créer un tag release pour préparer `deploy_production`
