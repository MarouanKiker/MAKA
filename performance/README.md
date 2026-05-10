# Tests de performance MAKA

Section technique SRE pour le rapport : [`../docs/OBSERVABILITE_SRE.md`](../docs/OBSERVABILITE_SRE.md)

Ce dossier contient un scénario de test de charge k6 et un script d'export des données d'observabilité.

## 1. Lancer la stack

Depuis `services` :

```powershell
docker compose up -d --build
```

Vérifier :

```powershell
curl.exe http://localhost:8000/health
curl.exe http://localhost:9090/-/healthy
curl.exe http://localhost:9200
```

## 2. Lancer un test de performance

Depuis la racine du projet `MAKA` :

```powershell
docker run --rm -i `
  -v "${PWD}\performance:/scripts" `
  grafana/k6:0.53.0 run `
  -e BASE_URL=http://host.docker.internal:8000 `
  -e VUS=10 `
  -e DURATION=2m `
  /scripts/k6/maka-load-test.js
```

Avec authentification :

```powershell
docker run --rm -i `
  -v "${PWD}\performance:/scripts" `
  grafana/k6:0.53.0 run `
  -e BASE_URL=http://host.docker.internal:8000 `
  -e AUTH_EMAIL=marouankiker@gmail.com `
  -e AUTH_PASSWORD=admin123 `
  -e VUS=10 `
  -e DURATION=2m `
  /scripts/k6/maka-load-test.js
```

Version CMD en une seule ligne pour tester tous les services via le réseau Docker :

```cmd
docker run --rm -i --network services_hub-network -v "%cd%\performance:/scripts" grafana/k6:0.53.0 run -e BASE_URL=http://gateway -e VUS=10 -e DURATION=2m /scripts/k6/maka-load-test.js
```

Le test complet doit afficher des checks pour :

- `gateway_health`
- `auth_forgot_password`
- `crm_swagger`
- `finance_health`
- `stock_health`
- `hr_employes`
- `sales_health`

Si un compte valide est disponible, ajouter `AUTH_EMAIL` et `AUTH_PASSWORD` pour tester aussi les endpoints métier protégés :

```cmd
docker run --rm -i --network services_hub-network -v "%cd%\performance:/scripts" grafana/k6:0.53.0 run -e BASE_URL=http://gateway -e AUTH_EMAIL=marouankiker@gmail.com -e AUTH_PASSWORD=admin123 -e VUS=10 -e DURATION=2m /scripts/k6/maka-load-test.js
```

Test court pour la soutenance avec 50 utilisateurs pendant 3 secondes :

```cmd
docker run --rm -i --network services_hub-network -v "%cd%\performance:/scripts" grafana/k6:0.53.0 run -e BASE_URL=http://gateway -e AUTH_EMAIL=marouankiker@gmail.com -e AUTH_PASSWORD=admin123 -e VUS=50 -e DURATION=3s /scripts/k6/maka-load-test.js
```

Dans ce cas, le test ajoute aussi :

- `auth_login`
- `crm_leads`
- `finance_factures`
- `stock_articles`

## 3. Observer pendant le test

- Grafana : `http://localhost:3000`
- Prometheus targets : `http://localhost:9090/targets`
- Kibana Discover : `http://localhost:5601`

Dans Grafana, ouvrir le dashboard `MAKA - Supervision`.

## 4. Exporter les données pour le rapport

Depuis la racine du projet `MAKA` :

```powershell
.\performance\scripts\export-observability.ps1
```

Les fichiers seront créés dans :

```text
performance/exports/elasticsearch
performance/exports/prometheus
```

Ces exports peuvent être utilisés comme preuves pour le rapport PFA :

- logs centralisés Elasticsearch/Kibana ;
- état des targets Prometheus ;
- métriques CPU/mémoire des conteneurs ;
- taux de requêtes HTTP des services Spring.
