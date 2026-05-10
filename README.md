# 🚀 MAKA ERP — Enterprise Intelligence Platform

![MAKA Logo](https://raw.githubusercontent.com/MarouanKiker/MAKA/main/frontend/src/assets/logo.png)

**MAKA ERP** est une plateforme de gestion d'entreprise modulaire, basée sur une architecture microservices polyglotte et pilotée par l'intelligence artificielle. Ce projet démontre l'intégration de systèmes hétérogènes complexes orchestrés par Docker, offrant une solution complète pour le CRM, la Finance, les RH, la Gestion de Stock et les Ventes.

---

## 🏛️ Architecture du Système

Le projet repose sur une architecture **Microservices Polyglotte** composée de **24 conteneurs Docker** :

*   **Frontend :** Angular 17 (Standalone Components, SCSS, Responsive Design).
*   **API Gateway :** Nginx (Routage centralisé et gestion CORS).
*   **Backend Services :**
    *   **Auth Service :** PHP 8.2 / Symfony 7 (Sécurité JWT RSA).
    *   **CRM Service :** .NET 8 / C# (Gestion des leads et opportunités).
    *   **Finance Service :** Java 17 / Spring Boot 3 (Comptabilité en partie double & Redis).
    *   **Stock Service :** Java 17 / Spring Boot 3 (Gestion d'inventaire haute performance JDBC).
    *   **HR Service :** Java 17 / Spring Boot 3 (Gestion des employés et paie).
    *   **Sales & IA Service :** Python 3.11 / FastAPI (Machine Learning & RAG++ Chatbot).
*   **Messaging :** RabbitMQ (Communication événementielle asynchrone).
*   **Observabilité (SRE Stack) :** Prometheus, Grafana, cAdvisor, ELK (Elasticsearch, Logstash, Kibana).

---

## ✨ Fonctionnalités Clés

### 📊 Intelligence Artificielle & Data Science
*   **Lead Scoring :** Algorithme Random Forest pour prédire la conversion des prospects.
*   **Sales Forecast :** Prévisions de ventes via Gradient Boosting.
*   **Segmentation Client :** Clustering K-Means pour l'analyse marketing.
*   **Assistant RAG++ :** Chatbot IA (Gemini/OpenRouter) avec contexte métier en temps réel.

### 💼 Modules Métier
*   **CRM 360° :** Pipeline Kanban, gestion des tickets, interactions clients et synchronisation d'agenda.
*   **Finance & Comptabilité :** Génération de factures PDF, gestion des paiements et journal comptable automatique.
*   **Gestion de Stock :** Suivi multi-dépôts, mouvements de stock et alertes de seuil critique.
*   **Ressources Humaines :** Gestion des contrats, congés, fiches de paie et portail employé dédié.

### 🛡️ Sécurité & Infrastructure
*   **Authentification Centralisée :** Système JWT avec clés privées/publiques RSA partagées.
*   **Résilience :** Implémentation de Circuit Breakers (Resilience4j) et pattern SAGA pour les transactions distribuées.
*   **Performance :** Cache distribué Redis et optimisation des requêtes via JDBC natif pour le module Stock.

---

## 📈 Observabilité & Monitoring

MAKA ERP intègre une stack de supervision de niveau industriel :
*   **Grafana :** Tableaux de bord en temps réel pour le CPU, la RAM et les métriques métier.
*   **Prometheus :** Collecte automatique des métriques de chaque microservice.
*   **ELK Stack :** Centralisation et analyse des logs applicatifs.
*   **Blackbox Exporter :** Monitoring de la disponibilité (Uptime) des endpoints API.

---

## 🚀 Installation Rapide

### Prérequis
*   Docker & Docker Compose
*   Node.js 20+ (pour le développement frontend)

### Lancement via Docker
```bash
# Cloner le projet
git clone https://github.com/MarouanKiker/MAKA.git
cd MAKA/services

# Lancer l'infrastructure et les microservices
docker-compose up -d
```

### Lancement du Frontend (Dev Mode)
```bash
cd ../frontend
npm install
npm start
```
Accédez à l'application sur : `http://localhost:4200` (API Gateway sur le port `8000`).

---

## 👥 Contributeurs

Ce projet a été réalisé par une équipe de passionnés :
*   **Marouan Kiker** — Architecte Système & Fullstack
*   **Abdellah Ajebli** — Backend Developer & CRM Expert
*   **Abderrahmane Missaoui** — DevOps & SRE Engineer
*   **Abdelilah Hamdaoui** — Frontend & CRM Specialist

---

## 📄 Licence
Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
