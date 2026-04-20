# 💰 Finance Service — Microservice Finance & Comptabilité

> Module Finance & Comptabilité du projet **MAKA ERP** — Architecture Microservices  
> **Stack** : Java 21 / Spring Boot 3.x / PostgreSQL / Redis / RabbitMQ  
> **Année universitaire** : 2025–2026

---

## 📑 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture globale](#2-architecture-globale)
3. [Phase 1 — Fondations & Setup](#3-phase-1--fondations--setup)
4. [Phase 2 — Modèle de domaine & Entités](#4-phase-2--modèle-de-domaine--entités)
5. [Phase 3 — Module Facturation (Invoice)](#5-phase-3--module-facturation-invoice)
6. [Phase 4 — Module Paiement (Payment)](#6-phase-4--module-paiement-payment)
7. [Phase 5 — Module Comptabilité (Accounting)](#7-phase-5--module-comptabilité-accounting)
8. [Phase 6 — Communication événementielle (RabbitMQ)](#8-phase-6--communication-événementielle-rabbitmq)
9. [Phase 7 — Sécurité (JWT / RBAC)](#9-phase-7--sécurité-jwt--rbac)
10. [Phase 8 — Cache distribué (Redis)](#10-phase-8--cache-distribué-redis)
11. [Phase 9 — Résilience & Tolérance aux pannes](#11-phase-9--résilience--tolérance-aux-pannes)
12. [Phase 10 — Observabilité (Monitoring & Logging)](#12-phase-10--observabilité-monitoring--logging)
13. [Phase 11 — Stratégie de Tests](#13-phase-11--stratégie-de-tests)
14. [Phase 12 — Intégration Gateway & Déploiement](#14-phase-12--intégration-gateway--déploiement)
15. [Résumé du planning](#15-résumé-du-planning)
16. [Références](#16-références)

---

## 1. Vue d'ensemble

### 1.1 Contexte

Le **finance-service** est un microservice dédié à la finance et à la comptabilité, intégré au sein de l'architecture ERP distribuée **MAKA**. Il fait partie d'un écosystème de microservices comprenant :

| Service | Stack | Rôle |
|---------|-------|------|
| 🔐 auth-service | PHP / Symfony | Authentification & gestion des utilisateurs |
| 👥 crm-service | C# / ASP.NET Core | Gestion de la relation client |
| 👔 hr-service | Node.js / Express | Ressources humaines |
| **💰 finance-service** | **Java / Spring Boot** | **Finance & Comptabilité** |
| 🛒 sales-service | Python / FastAPI | Ventes |
| 📦 stock-service | Node.js | Gestion des stocks |
| 🌐 gateway | Nginx | Reverse proxy / routage |

### 1.2 Objectifs du finance-service

L'objectif est de construire un système **modulaire, évolutif et résilient**, capable de gérer :

- ✅ Le **cycle de vie complet des factures** (création → validation → envoi → paiement)
- ✅ Les **paiements multicanaux** (virement, carte bancaire, chèque, espèces)
- ✅ La **comptabilité en partie double** via un journal de transactions
- ✅ La **génération de rapports financiers** consolidés (bilan, compte de résultat, balance)

### 1.3 Besoins non fonctionnels

| Catégorie | Cible |
|-----------|-------|
| **Performance** | Temps de réponse < 200 ms pour les lectures. Capacité de 1 000 factures/min en pic. |
| **Disponibilité** | 99,9 % (≈ 8,76 h d'indisponibilité/an max) |
| **Scalabilité** | Mise à l'échelle horizontale indépendante |
| **Sécurité** | OAuth2/JWT via auth-service. Chiffrement TLS. Audit trail complet. |
| **Maintenabilité** | Couverture de tests ≥ 80 %. Documentation API via OpenAPI/Swagger. |
| **Résilience** | Circuit breaker, retry avec backoff exponentiel, pattern SAGA |
| **Observabilité** | Métriques Prometheus/Grafana. Logs centralisés (ELK Stack). |

### 1.4 Acteurs du système

| Acteur | Rôle |
|--------|------|
| **Administrateur** | Gère la configuration, les utilisateurs et les droits d'accès |
| **Comptable** | Crée/valide les factures, enregistre les paiements, gère le journal |
| **Gestionnaire** | Consulte les tableaux de bord, les rapports et les indicateurs |
| **Systèmes externes** | Autres microservices MAKA (CRM, Sales, Stock) via RabbitMQ |

---

## 2. Architecture globale

### 2.1 Les 9 composants essentiels

Le finance-service s'intègre dans une architecture à 9 composants :

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Web/Mobile)                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ①  API Gateway (Nginx)
                           │
                    ②  Service Registry
                           │
              ┌────────────┼────────────────┐
              │            │                │
        ③ Invoice    ③ Payment      ③ Accounting
          Service      Service        Service
              │            │                │
              └────────────┼────────────────┘
                           │
           ④ Authorization Server (auth-service)
                           │
              ┌────────────┼────────────────┐
              │            │                │
        ⑤ PostgreSQL  ⑥ Redis Cache   ⑦ Load Balancer
         (Replication)                      │
              └────────────┼────────────────┘
                           │
              ⑧ RabbitMQ (Messagerie distribuée)
                           │
              ⑨ Observabilité (Prometheus + Grafana + ELK)
```

### 2.2 Flux complet d'une requête (exemple : enregistrement de paiement)

1. L'**utilisateur** soumet un paiement via l'interface client
2. La requête atteint l'**API Gateway** (Nginx) ①
3. Le Gateway vérifie le **jeton JWT** auprès du auth-service ④
4. La requête est routée vers le **Payment Service** ③
5. Le service vérifie le **cache Redis** ⑥ pour les données de la facture
6. Le paiement est persisté dans **PostgreSQL** ⑤
7. Un événement `PaymentReceived` est publié sur **RabbitMQ** ⑧
8. Le **Invoice Service** consomme l'événement et met à jour le statut de la facture
9. Le **Accounting Service** consomme l'événement et crée l'écriture comptable
10. Les **métriques et logs** sont collectés par Prometheus et la pile ELK ⑨

---

## 3. Phase 1 — Fondations & Setup

> **Durée estimée** : Semaine 1–2  
> **Objectif** : Initialiser le projet, configurer l'environnement de développement

### 3.1 Initialisation du projet Spring Boot

Créer le projet via [Spring Initializr](https://start.spring.io/) avec les paramètres suivants :

| Paramètre | Valeur |
|-----------|--------|
| **Group** | `com.maka` |
| **Artifact** | `finance-service` |
| **Java** | 21 |
| **Spring Boot** | 3.3.x |
| **Packaging** | Jar |
| **Build** | Maven |

**Dépendances à inclure :**

```xml
<!-- Core -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-validation</dependency>

<!-- Base de données -->
<dependency>postgresql</dependency>
<dependency>flyway-core</dependency>
<dependency>flyway-database-postgresql</dependency>

<!-- Sécurité -->
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-oauth2-resource-server</dependency>

<!-- Messagerie -->
<dependency>spring-boot-starter-amqp</dependency> <!-- RabbitMQ -->

<!-- Cache -->
<dependency>spring-boot-starter-data-redis</dependency>
<dependency>spring-boot-starter-cache</dependency>

<!-- Observabilité -->
<dependency>spring-boot-starter-actuator</dependency>
<dependency>micrometer-registry-prometheus</dependency>
<dependency>logstash-logback-encoder</dependency>

<!-- Résilience -->
<dependency>resilience4j-spring-boot3</dependency>

<!-- Utilitaires -->
<dependency>lombok</dependency>
<dependency>mapstruct</dependency>
<dependency>springdoc-openapi-starter-webmvc-ui</dependency>

<!-- Tests -->
<dependency>spring-boot-starter-test</dependency>
<dependency>spring-security-test</dependency>
<dependency>testcontainers</dependency>
<dependency>testcontainers-postgresql</dependency>
<dependency>testcontainers-rabbitmq</dependency>
```

### 3.2 Structure du projet

```
finance-service/
├── src/
│   ├── main/
│   │   ├── java/com/maka/finance/
│   │   │   ├── FinanceServiceApplication.java
│   │   │   │
│   │   │   ├── config/                    # Configuration
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RabbitMQConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   ├── OpenApiConfig.java
│   │   │   │   └── ResilienceConfig.java
│   │   │   │
│   │   │   ├── entity/                    # Entités JPA
│   │   │   │   ├── Facture.java
│   │   │   │   ├── LigneFacture.java
│   │   │   │   ├── Paiement.java
│   │   │   │   ├── ModePaiement.java
│   │   │   │   ├── CompteBancaire.java
│   │   │   │   ├── JournalTransaction.java
│   │   │   │   └── RapportFinancier.java
│   │   │   │
│   │   │   ├── enums/                     # Enums
│   │   │   │   ├── StatutFacture.java
│   │   │   │   ├── StatutPaiement.java
│   │   │   │   ├── TypePaiement.java
│   │   │   │   └── TypeRapport.java
│   │   │   │
│   │   │   ├── repository/               # JPA Repositories
│   │   │   │   ├── FactureRepository.java
│   │   │   │   ├── LigneFactureRepository.java
│   │   │   │   ├── PaiementRepository.java
│   │   │   │   ├── ModePaiementRepository.java
│   │   │   │   ├── CompteBancaireRepository.java
│   │   │   │   ├── JournalTransactionRepository.java
│   │   │   │   └── RapportFinancierRepository.java
│   │   │   │
│   │   │   ├── dto/                       # Data Transfer Objects
│   │   │   │   ├── invoice/
│   │   │   │   │   ├── CreateFactureRequest.java
│   │   │   │   │   ├── UpdateFactureRequest.java
│   │   │   │   │   ├── FactureResponse.java
│   │   │   │   │   ├── LigneFactureRequest.java
│   │   │   │   │   ├── LigneFactureResponse.java
│   │   │   │   │   └── ChangeStatutRequest.java
│   │   │   │   ├── payment/
│   │   │   │   │   ├── CreatePaiementRequest.java
│   │   │   │   │   ├── PaiementResponse.java
│   │   │   │   │   └── ValidatePaiementRequest.java
│   │   │   │   ├── accounting/
│   │   │   │   │   ├── JournalEntryResponse.java
│   │   │   │   │   ├── GenerateReportRequest.java
│   │   │   │   │   └── RapportResponse.java
│   │   │   │   └── event/
│   │   │   │       ├── FinanceEvent.java
│   │   │   │       ├── InvoiceEvent.java
│   │   │   │       └── PaymentEvent.java
│   │   │   │
│   │   │   ├── mapper/                    # MapStruct Mappers
│   │   │   │   ├── FactureMapper.java
│   │   │   │   ├── PaiementMapper.java
│   │   │   │   └── JournalMapper.java
│   │   │   │
│   │   │   ├── service/                   # Business Logic
│   │   │   │   ├── FactureService.java
│   │   │   │   ├── PaiementService.java
│   │   │   │   ├── ComptabiliteService.java
│   │   │   │   └── RapportService.java
│   │   │   │
│   │   │   ├── controller/               # REST Controllers
│   │   │   │   ├── FactureController.java
│   │   │   │   ├── PaiementController.java
│   │   │   │   ├── JournalController.java
│   │   │   │   └── RapportController.java
│   │   │   │
│   │   │   ├── event/                     # RabbitMQ Events
│   │   │   │   ├── publisher/
│   │   │   │   │   └── FinanceEventPublisher.java
│   │   │   │   └── consumer/
│   │   │   │       └── FinanceEventConsumer.java
│   │   │   │
│   │   │   └── exception/                # Gestion des erreurs
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       ├── FactureNotFoundException.java
│   │   │       ├── PaiementNotFoundException.java
│   │   │       ├── InvalidStatutTransitionException.java
│   │   │       ├── MontantExcedeResteAPayerException.java
│   │   │       └── DesequilibreComptableException.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── logback-spring.xml
│   │       └── db/migration/
│   │           ├── V1__create_factures.sql
│   │           ├── V2__create_lignes_facture.sql
│   │           ├── V3__create_modes_paiement.sql
│   │           ├── V4__create_comptes_bancaires.sql
│   │           ├── V5__create_paiements.sql
│   │           ├── V6__create_journal_transactions.sql
│   │           ├── V7__create_rapports_financiers.sql
│   │           └── V8__create_indexes.sql
│   │
│   └── test/java/com/maka/finance/
│       ├── service/
│       │   ├── FactureServiceTest.java
│       │   ├── PaiementServiceTest.java
│       │   └── ComptabiliteServiceTest.java
│       ├── controller/
│       │   ├── FactureControllerTest.java
│       │   └── PaiementControllerTest.java
│       ├── repository/
│       │   └── FactureRepositoryTest.java
│       └── integration/
│           └── FinanceIntegrationTest.java
│
├── Dockerfile
├── pom.xml
└── README.md
```

### 3.3 Configuration `application.yml`

```yaml
server:
  port: 8080

spring:
  application:
    name: finance-service

  # --- Base de données ---
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:finance_db}
    username: ${DB_USER:finance}
    password: ${DB_PASSWORD:finance_secret}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway gère les migrations
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  # --- Flyway ---
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  # --- RabbitMQ ---
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASSWORD:guest}

  # --- Redis ---
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
  cache:
    type: redis
    redis:
      time-to-live: 300000  # 5 minutes par défaut

  # --- Sécurité OAuth2 ---
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: ${AUTH_SERVICE_URL:http://localhost:8081}
          jwk-set-uri: ${AUTH_SERVICE_URL:http://localhost:8081}/.well-known/jwks.json

# --- Actuator / Prometheus ---
management:
  endpoints:
    web:
      exposure:
        include: health, prometheus, info, metrics
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      service: finance-service

# --- Logging ---
logging:
  level:
    com.maka.finance: DEBUG
    org.springframework.security: INFO
```

### 3.4 Dockerfile (multi-stage)

```dockerfile
# === Stage 1 : Build ===
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# === Stage 2 : Runtime ===
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/target/*.jar app.jar

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
```

### 3.5 Ajout au `docker-compose.yml`

```yaml
# === Finance Service ===
finance-service:
  build:
    context: ./finance-service
    dockerfile: Dockerfile
  container_name: maka-finance-service
  ports:
    - "8083:8080"
  environment:
    - DB_HOST=finance-db
    - DB_PORT=5432
    - DB_NAME=finance_db
    - DB_USER=finance
    - DB_PASSWORD=${FINANCE_DB_PASSWORD:-finance_secret}
    - RABBITMQ_HOST=rabbitmq
    - RABBITMQ_PORT=5672
    - RABBITMQ_USER=${RABBITMQ_USER:-guest}
    - RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD:-guest}
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - AUTH_SERVICE_URL=http://auth-service:8080
    - SPRING_PROFILES_ACTIVE=dev
  depends_on:
    finance-db:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
    redis:
      condition: service_started
  networks:
    - maka-network
  restart: unless-stopped

# === Finance Database ===
finance-db:
  image: postgres:16-alpine
  container_name: maka-finance-db
  environment:
    POSTGRES_DB: finance_db
    POSTGRES_USER: finance
    POSTGRES_PASSWORD: ${FINANCE_DB_PASSWORD:-finance_secret}
  ports:
    - "5435:5432"
  volumes:
    - finance_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U finance -d finance_db"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - maka-network

# === Redis (partagé ou dédié) ===
redis:
  image: redis:7-alpine
  container_name: maka-redis
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
  networks:
    - maka-network

volumes:
  finance_data:
  redis_data:
```

### 3.6 Checklist Phase 1

- [ ] Projet Spring Boot initialisé avec toutes les dépendances
- [ ] Structure de dossiers créée
- [ ] `application.yml` configuré (DB, RabbitMQ, Redis, Auth)
- [ ] Dockerfile multi-stage fonctionnel
- [ ] Service ajouté au `docker-compose.yml`
- [ ] `docker-compose up` démarre sans erreur
- [ ] Endpoint `/actuator/health` retourne `UP`

---

## 4. Phase 2 — Modèle de domaine & Entités

> **Durée estimée** : Semaine 2–3  
> **Objectif** : Créer le modèle de données complet basé sur le diagramme UML

### 4.1 Diagramme de classes UML

Le modèle de domaine comprend **8 entités principales** organisées en 3 couches :

```
┌─────────────────────────────────────────────────────────┐
│                  COUCHE FACTURATION                      │
│  ┌──────────────┐    1    ┌────────────────┐            │
│  │   Facture     │────────│ LigneFacture   │            │
│  │              │   1..*  │                │            │
│  └──────────────┘         └────────────────┘            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  COUCHE PAIEMENT                         │
│  ┌──────────────┐  *   1  ┌────────────────┐            │
│  │  Paiement    │────────│ ModePaiement   │            │
│  │              │         └────────────────┘            │
│  │              │  0..1 1 ┌────────────────┐            │
│  │              │────────│ CompteBancaire │            │
│  └──────┬───────┘         └────────────────┘            │
│         │ *..0..1                                       │
│         │ (référence)                                   │
│  ┌──────┴───────┐                                       │
│  │   Facture     │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                COUCHE COMPTABILITÉ                       │
│  ┌──────────────────────┐  *  1  ┌──────────────────┐   │
│  │ JournalTransaction   │───────│RapportFinancier  │   │
│  └──────────────────────┘        └──────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│               COUCHE TRANSVERSALE                        │
│  ┌──────────────┐                                       │
│  │ Utilisateur  │  (référencé via JWT, pas stocké ici)  │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Enums

```java
// StatutFacture.java
public enum StatutFacture {
    BROUILLON,              // Facture en cours de rédaction
    VALIDEE,                // Facture validée, prête à être envoyée
    ENVOYEE,                // Facture envoyée au client
    PARTIELLEMENT_PAYEE,    // Paiement partiel reçu
    PAYEE,                  // Facture entièrement payée
    ANNULEE                 // Facture annulée
}

// StatutPaiement.java
public enum StatutPaiement {
    EN_ATTENTE,    // Paiement en attente de validation
    VALIDE,        // Paiement validé
    REJETE,        // Paiement rejeté
    REMBOURSE      // Paiement remboursé
}

// TypePaiement.java
public enum TypePaiement {
    ACOMPTE,    // Paiement partiel anticipé
    SOLDE,      // Paiement du solde restant
    AVOIR       // Avoir / remboursement
}

// TypeRapport.java
public enum TypeRapport {
    BILAN,              // Bilan comptable
    COMPTE_RESULTAT,    // Compte de résultat
    BALANCE             // Balance des comptes
}
```

### 4.3 Entités JPA détaillées

#### 4.3.1 Entité `Facture`

```java
@Entity
@Table(name = "factures")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String numero;                  // Ex: FAC-2026-00142

    @Column(name = "montant_ht", precision = 15, scale = 2, nullable = false)
    private BigDecimal montantHT = BigDecimal.ZERO;

    @Column(name = "taux_tva", precision = 5, scale = 4, nullable = false)
    private BigDecimal tauxTVA = new BigDecimal("0.2000");  // 20% par défaut

    @Column(name = "montant_ttc", precision = 15, scale = 2, nullable = false)
    private BigDecimal montantTTC = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal taxe = BigDecimal.ZERO;

    @Column(name = "montant_paye", precision = 15, scale = 2, nullable = false)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(name = "reste_a_payer", precision = 15, scale = 2, nullable = false)
    private BigDecimal resteAPayer = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private StatutFacture statut = StatutFacture.BROUILLON;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneFacture> lignes = new ArrayList<>();

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ===== MÉTHODES MÉTIER =====

    /**
     * Recalcule l'ensemble des montants (HT, taxe, TTC, resteAPayer)
     * en se basant sur les lignes de facture et les paiements associés.
     */
    public void calculerMontants() {
        this.montantHT = lignes.stream()
            .map(LigneFacture::getTotalLigne)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.taxe = montantHT.multiply(tauxTVA)
            .setScale(2, RoundingMode.HALF_UP);

        this.montantTTC = montantHT.add(taxe);
        this.resteAPayer = montantTTC.subtract(montantPaye);
    }

    /**
     * Met à jour le montantPaye et le resteAPayer lorsqu'un paiement est reçu.
     * Si le resteAPayer atteint zéro, le statut passe automatiquement à PAYÉE.
     */
    public void appliquerPaiement(BigDecimal montant) {
        this.montantPaye = this.montantPaye.add(montant);
        this.resteAPayer = this.montantTTC.subtract(this.montantPaye);

        if (this.resteAPayer.compareTo(BigDecimal.ZERO) <= 0) {
            this.resteAPayer = BigDecimal.ZERO;
            this.statut = StatutFacture.PAYEE;
        } else if (this.montantPaye.compareTo(BigDecimal.ZERO) > 0) {
            this.statut = StatutFacture.PARTIELLEMENT_PAYEE;
        }
    }
}
```

#### 4.3.2 Entité `LigneFacture`

```java
@Entity
@Table(name = "lignes_facture")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LigneFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String produit;

    @Column(nullable = false)
    private Integer quantite;

    @Column(name = "prix_unitaire", precision = 15, scale = 2, nullable = false)
    private BigDecimal prixUnitaire;

    @Column(name = "total_ligne", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalLigne = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    @PrePersist @PreUpdate
    public void calculerTotal() {
        this.totalLigne = prixUnitaire.multiply(BigDecimal.valueOf(quantite));
    }
}
```

#### 4.3.3 Entité `Paiement`

```java
@Entity
@Table(name = "paiements")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_paiement", nullable = false)
    private LocalDateTime datePaiement = LocalDateTime.now();

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private TypePaiement type;

    @Column(name = "reference_transaction", unique = true, nullable = false, length = 100)
    private String referenceTransaction;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id")
    private Facture facture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mode_paiement_id", nullable = false)
    private ModePaiement modePaiement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_bancaire_id")
    private CompteBancaire compteBancaire;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (datePaiement == null) datePaiement = LocalDateTime.now();
    }
}
```

#### 4.3.4 Entité `JournalTransaction`

```java
@Entity
@Table(name = "journal_transactions")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class JournalTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_ecriture", nullable = false)
    private LocalDateTime dateEcriture = LocalDateTime.now();

    @Column(name = "compte_debit", length = 10, nullable = false)
    private String compteDebit;      // Ex: 411000 (Clients)

    @Column(name = "compte_credit", length = 10, nullable = false)
    private String compteCredit;     // Ex: 701000 (Ventes)

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal debit;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal credit;       // RÈGLE : debit == credit

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "type_reference", length = 30, nullable = false)
    private String typeReference;    // "FACTURE" ou "PAIEMENT"

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (dateEcriture == null) dateEcriture = LocalDateTime.now();
    }
}
```

#### 4.3.5 Entités de support

```java
// ModePaiement.java
@Entity
@Table(name = "modes_paiement")
public class ModePaiement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false, length = 50)
    private String libelle;  // VIREMENT, CARTE_BANCAIRE, CHEQUE, ESPECES
}

// CompteBancaire.java
@Entity
@Table(name = "comptes_bancaires")
public class CompteBancaire {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false, length = 34)
    private String iban;
    @Column(nullable = false, length = 100)
    private String banque;
}

// RapportFinancier.java
@Entity
@Table(name = "rapports_financiers")
public class RapportFinancier {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING) @Column(length = 50, nullable = false)
    private TypeRapport type;
    @Column(name = "date_rapport", nullable = false)
    private LocalDateTime dateRapport;
    @Column(name = "donnees_consolidees", columnDefinition = "jsonb", nullable = false)
    private String donneesConsolidees;  // JSON
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

### 4.4 Migrations Flyway

#### `V1__create_factures.sql`
```sql
CREATE TABLE factures (
    id                SERIAL PRIMARY KEY,
    numero            VARCHAR(50) UNIQUE NOT NULL,
    montant_ht        DECIMAL(15,2) NOT NULL DEFAULT 0,
    taux_tva          DECIMAL(5,4) NOT NULL DEFAULT 0.2000,
    montant_ttc       DECIMAL(15,2) NOT NULL DEFAULT 0,
    taxe              DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_paye      DECIMAL(15,2) NOT NULL DEFAULT 0,
    reste_a_payer     DECIMAL(15,2) NOT NULL DEFAULT 0,
    statut            VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_by        INTEGER NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_statut CHECK (statut IN (
        'BROUILLON','VALIDEE','ENVOYEE',
        'PARTIELLEMENT_PAYEE','PAYEE','ANNULEE'))
);
```

#### `V2__create_lignes_facture.sql`
```sql
CREATE TABLE lignes_facture (
    id              SERIAL PRIMARY KEY,
    facture_id      INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    produit         VARCHAR(255) NOT NULL,
    quantite        INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire   DECIMAL(15,2) NOT NULL CHECK (prix_unitaire >= 0),
    total_ligne     DECIMAL(15,2) NOT NULL DEFAULT 0
);
```

#### `V3__create_modes_paiement.sql`
```sql
CREATE TABLE modes_paiement (
    id       SERIAL PRIMARY KEY,
    libelle  VARCHAR(50) UNIQUE NOT NULL
);

-- Données de référence
INSERT INTO modes_paiement (libelle) VALUES
    ('VIREMENT'), ('CARTE_BANCAIRE'), ('CHEQUE'), ('ESPECES');
```

#### `V4__create_comptes_bancaires.sql`
```sql
CREATE TABLE comptes_bancaires (
    id      SERIAL PRIMARY KEY,
    iban    VARCHAR(34) UNIQUE NOT NULL,
    banque  VARCHAR(100) NOT NULL
);
```

#### `V5__create_paiements.sql`
```sql
CREATE TABLE paiements (
    id                      SERIAL PRIMARY KEY,
    date_paiement           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    montant                 DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    type                    VARCHAR(30) NOT NULL,
    reference_transaction   VARCHAR(100) UNIQUE NOT NULL,
    statut                  VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    facture_id              INTEGER REFERENCES factures(id),
    mode_paiement_id        INTEGER NOT NULL REFERENCES modes_paiement(id),
    compte_bancaire_id      INTEGER REFERENCES comptes_bancaires(id),
    created_by              INTEGER NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_paiement_statut CHECK (statut IN (
        'EN_ATTENTE','VALIDE','REJETE','REMBOURSE'))
);
```

#### `V6__create_journal_transactions.sql`
```sql
CREATE TABLE journal_transactions (
    id               SERIAL PRIMARY KEY,
    date_ecriture    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    compte_debit     VARCHAR(10) NOT NULL,
    compte_credit    VARCHAR(10) NOT NULL,
    debit            DECIMAL(15,2) NOT NULL CHECK (debit >= 0),
    credit           DECIMAL(15,2) NOT NULL CHECK (credit >= 0),
    description      TEXT,
    type_reference   VARCHAR(30) NOT NULL,
    reference_id     INTEGER NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_equilibre CHECK (debit = credit)
);
```

#### `V7__create_rapports_financiers.sql`
```sql
CREATE TABLE rapports_financiers (
    id                    SERIAL PRIMARY KEY,
    type                  VARCHAR(50) NOT NULL,
    date_rapport          TIMESTAMP NOT NULL,
    donnees_consolidees   JSONB NOT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `V8__create_indexes.sql`
```sql
-- Factures
CREATE INDEX idx_factures_statut ON factures(statut);
CREATE INDEX idx_factures_numero ON factures(numero);
CREATE INDEX idx_factures_created_by ON factures(created_by);
CREATE INDEX idx_factures_created_at ON factures(created_at DESC);

-- Lignes facture
CREATE INDEX idx_lignes_facture_id ON lignes_facture(facture_id);

-- Paiements
CREATE INDEX idx_paiements_facture ON paiements(facture_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_reference ON paiements(reference_transaction);

-- Journal
CREATE INDEX idx_journal_date ON journal_transactions(date_ecriture);
CREATE INDEX idx_journal_compte_debit ON journal_transactions(compte_debit);
CREATE INDEX idx_journal_compte_credit ON journal_transactions(compte_credit);
CREATE INDEX idx_journal_reference ON journal_transactions(type_reference, reference_id);
```

### 4.5 Checklist Phase 2

- [ ] Tous les enums créés
- [ ] 8 entités JPA créées avec annotations correctes
- [ ] Relations JPA configurées (OneToMany, ManyToOne)
- [ ] 8 fichiers de migration Flyway écrits
- [ ] `flyway:migrate` s'exécute sans erreur
- [ ] Schéma de base de données vérifié dans pgAdmin/DBeaver

---

## 5. Phase 3 — Module Facturation (Invoice)

> **Durée estimée** : Semaine 3–5  
> **Objectif** : Implémenter le CRUD complet des factures avec la machine à états

### 5.1 Repository

```java
public interface FactureRepository extends JpaRepository<Facture, Long> {
    Optional<Facture> findByNumero(String numero);
    boolean existsByNumero(String numero);
    Page<Facture> findByStatut(StatutFacture statut, Pageable pageable);
    Page<Facture> findByCreatedBy(Long userId, Pageable pageable);
    
    @Query("SELECT f FROM Facture f WHERE f.statut = 'ENVOYEE' " +
           "AND f.resteAPayer > 0 AND f.createdAt < :dateLimit")
    List<Facture> findFacturesEnRetard(@Param("dateLimit") LocalDateTime dateLimit);
}
```

### 5.2 DTOs

```java
// CreateFactureRequest.java
public record CreateFactureRequest(
    @NotBlank String numero,
    @NotNull @DecimalMin("0.0001") BigDecimal tauxTVA,
    @NotEmpty @Valid List<LigneFactureRequest> lignes
) {}

// LigneFactureRequest.java
public record LigneFactureRequest(
    @NotBlank String produit,
    @NotNull @Min(1) Integer quantite,
    @NotNull @DecimalMin("0.00") BigDecimal prixUnitaire
) {}

// FactureResponse.java
public record FactureResponse(
    Long id, String numero,
    BigDecimal montantHT, BigDecimal tauxTVA,
    BigDecimal montantTTC, BigDecimal taxe,
    BigDecimal montantPaye, BigDecimal resteAPayer,
    StatutFacture statut,
    List<LigneFactureResponse> lignes,
    LocalDateTime createdAt, LocalDateTime updatedAt
) {}
```

### 5.3 Service — Machine à états

```java
@Service
@RequiredArgsConstructor
@Transactional
public class FactureService {

    private final FactureRepository factureRepository;
    private final FactureMapper factureMapper;
    private final FinanceEventPublisher eventPublisher;

    // Transitions autorisées (Chapitre 7.1 du rapport PFE)
    private static final Map<StatutFacture, Set<StatutFacture>> TRANSITIONS = Map.of(
        StatutFacture.BROUILLON,             Set.of(StatutFacture.VALIDEE, StatutFacture.ANNULEE),
        StatutFacture.VALIDEE,               Set.of(StatutFacture.ENVOYEE, StatutFacture.ANNULEE),
        StatutFacture.ENVOYEE,               Set.of(StatutFacture.PARTIELLEMENT_PAYEE, StatutFacture.PAYEE),
        StatutFacture.PARTIELLEMENT_PAYEE,   Set.of(StatutFacture.PAYEE)
        // PAYEE et ANNULEE sont des états terminaux
    );

    // === CRÉATION ===
    public FactureResponse creerFacture(CreateFactureRequest request, Long userId) {
        if (factureRepository.existsByNumero(request.numero())) {
            throw new DuplicateNumeroException(request.numero());
        }

        Facture facture = factureMapper.toEntity(request);
        facture.setCreatedBy(userId);
        facture.setStatut(StatutFacture.BROUILLON);

        // Ajouter les lignes et calculer les montants
        request.lignes().forEach(ligneReq -> {
            LigneFacture ligne = factureMapper.toLigneEntity(ligneReq);
            ligne.setFacture(facture);
            ligne.calculerTotal();
            facture.getLignes().add(ligne);
        });
        facture.calculerMontants();

        Facture saved = factureRepository.save(facture);
        return factureMapper.toResponse(saved);
    }

    // === CHANGEMENT DE STATUT ===
    public FactureResponse changerStatut(Long id, StatutFacture nouveauStatut) {
        Facture facture = findOrThrow(id);
        StatutFacture actuel = facture.getStatut();

        // Vérifier que la transition est autorisée
        Set<StatutFacture> transitionsAutorisees = TRANSITIONS.getOrDefault(actuel, Set.of());
        if (!transitionsAutorisees.contains(nouveauStatut)) {
            throw new InvalidStatutTransitionException(actuel, nouveauStatut);
        }

        // Validation spécifique pour BROUILLON → VALIDEE
        if (nouveauStatut == StatutFacture.VALIDEE) {
            validerFacture(facture);
        }

        facture.setStatut(nouveauStatut);
        Facture saved = factureRepository.save(facture);

        // Publier événement
        if (nouveauStatut == StatutFacture.VALIDEE) {
            eventPublisher.publishInvoiceCreated(factureMapper.toEvent(saved));
        }

        return factureMapper.toResponse(saved);
    }

    // === VALIDATION MÉTIER ===
    private void validerFacture(Facture facture) {
        if (facture.getLignes().isEmpty()) {
            throw new ValidationException("La facture doit contenir au moins une ligne");
        }
        if (facture.getMontantHT().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Le montant HT doit être positif");
        }
    }

    // === APPLIQUER PAIEMENT (appelé via événement RabbitMQ) ===
    public void appliquerPaiement(Long factureId, BigDecimal montant) {
        Facture facture = findOrThrow(factureId);
        facture.appliquerPaiement(montant);
        factureRepository.save(facture);
    }

    // === SUPPRESSION (brouillon uniquement) ===
    public void supprimerFacture(Long id) {
        Facture facture = findOrThrow(id);
        if (facture.getStatut() != StatutFacture.BROUILLON) {
            throw new InvalidOperationException(
                "Seules les factures en BROUILLON peuvent être supprimées");
        }
        factureRepository.delete(facture);
    }

    private Facture findOrThrow(Long id) {
        return factureRepository.findById(id)
            .orElseThrow(() -> new FactureNotFoundException(id));
    }
}
```

### 5.4 Controller REST

```java
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Factures", description = "Gestion du cycle de vie des factures")
public class FactureController {

    private final FactureService factureService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public FactureResponse creer(@Valid @RequestBody CreateFactureRequest request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return factureService.creerFacture(request, extractUserId(jwt));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COMPTABLE', 'GESTIONNAIRE', 'ADMIN')")
    public Page<FactureResponse> lister(
            @RequestParam(required = false) StatutFacture statut,
            Pageable pageable) {
        return factureService.listerFactures(statut, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'GESTIONNAIRE', 'ADMIN')")
    public FactureResponse consulter(@PathVariable Long id) {
        return factureService.getFacture(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public FactureResponse modifier(@PathVariable Long id,
                                     @Valid @RequestBody UpdateFactureRequest request) {
        return factureService.modifierFacture(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public FactureResponse changerStatut(@PathVariable Long id,
                                          @Valid @RequestBody ChangeStatutRequest request) {
        return factureService.changerStatut(id, request.statut());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimer(@PathVariable Long id) {
        factureService.supprimerFacture(id);
    }

    @PostMapping("/{id}/lines")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public FactureResponse ajouterLigne(@PathVariable Long id,
                                         @Valid @RequestBody LigneFactureRequest request) {
        return factureService.ajouterLigne(id, request);
    }

    @GetMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('COMPTABLE', 'ADMIN')")
    public List<LigneFactureResponse> listerLignes(@PathVariable Long id) {
        return factureService.getLignesFacture(id);
    }
}
```

### 5.5 Gestion des erreurs

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FactureNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(FactureNotFoundException ex) {
        return new ErrorResponse("FACTURE_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InvalidStatutTransitionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidTransition(InvalidStatutTransitionException ex) {
        return new ErrorResponse("INVALID_TRANSITION", ex.getMessage());
    }

    @ExceptionHandler(MontantExcedeResteAPayerException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleMontantExcede(MontantExcedeResteAPayerException ex) {
        return new ErrorResponse("MONTANT_EXCEDE", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
            .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return new ErrorResponse("VALIDATION_ERROR", "Erreurs de validation", errors);
    }
}

public record ErrorResponse(String code, String message, Object details) {
    public ErrorResponse(String code, String message) {
        this(code, message, null);
    }
}
```

### 5.6 Checklist Phase 3

- [ ] `FactureRepository` avec requêtes custom
- [ ] DTOs de création, modification, réponse
- [ ] MapStruct mapper configuré
- [ ] `FactureService` avec logique métier complète
- [ ] Machine à états avec transitions validées
- [ ] Méthode `calculerMontants()` testée
- [ ] Controller REST avec 8 endpoints
- [ ] Gestion des erreurs globale
- [ ] Swagger/OpenAPI accessible sur `/swagger-ui.html`
- [ ] Tests unitaires pour `FactureService`

---

## 6. Phase 4 — Module Paiement (Payment)

> **Durée estimée** : Semaine 5–7  
> **Objectif** : Implémenter l'enregistrement et le suivi des paiements avec les règles métier

### 6.1 Règles métier des paiements

Les règles de validation des paiements sont strictes :

1. ❌ Un paiement **ne peut pas dépasser** le `resteAPayer` de la facture associée
2. ❌ Un paiement ne peut être associé qu'à une facture en état **ENVOYÉE** ou **PARTIELLEMENT_PAYÉE**
3. ✅ La validation d'un paiement déclenche automatiquement la création de l'écriture comptable via RabbitMQ
4. ✅ Un paiement rejeté doit être suivi d'un ajustement (écriture de contrepassation)
5. ✅ L'**idempotence** est assurée par la vérification de la `referenceTransaction` unique

### 6.2 Service

```java
@Service
@RequiredArgsConstructor
@Transactional
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final FactureRepository factureRepository;
    private final PaiementMapper paiementMapper;
    private final FinanceEventPublisher eventPublisher;

    public PaiementResponse enregistrerPaiement(CreatePaiementRequest request, Long userId) {
        // 1. Idempotence : vérifier si la référence existe déjà
        if (paiementRepository.existsByReferenceTransaction(request.referenceTransaction())) {
            return paiementMapper.toResponse(
                paiementRepository.findByReferenceTransaction(request.referenceTransaction()).get()
            );
        }

        // 2. Récupérer et valider la facture
        Facture facture = factureRepository.findById(request.factureId())
            .orElseThrow(() -> new FactureNotFoundException(request.factureId()));

        // 3. Vérifier le statut de la facture
        if (facture.getStatut() != StatutFacture.ENVOYEE &&
            facture.getStatut() != StatutFacture.PARTIELLEMENT_PAYEE) {
            throw new InvalidOperationException(
                "Paiement impossible : facture en état " + facture.getStatut());
        }

        // 4. Vérifier que le montant ne dépasse pas le reste à payer
        if (request.montant().compareTo(facture.getResteAPayer()) > 0) {
            throw new MontantExcedeResteAPayerException(
                request.montant(), facture.getResteAPayer());
        }

        // 5. Créer le paiement
        Paiement paiement = paiementMapper.toEntity(request);
        paiement.setFacture(facture);
        paiement.setCreatedBy(userId);
        paiement.setStatut(StatutPaiement.EN_ATTENTE);

        Paiement saved = paiementRepository.save(paiement);

        // 6. Publier événement PaymentReceived
        eventPublisher.publishPaymentReceived(paiementMapper.toEvent(saved));

        return paiementMapper.toResponse(saved);
    }

    public PaiementResponse validerPaiement(Long id) {
        Paiement paiement = findOrThrow(id);

        if (paiement.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new InvalidOperationException("Seuls les paiements EN_ATTENTE peuvent être validés");
        }

        paiement.setStatut(StatutPaiement.VALIDE);
        Paiement saved = paiementRepository.save(paiement);

        // Publier événement PaymentValidated
        eventPublisher.publishPaymentValidated(paiementMapper.toEvent(saved));

        return paiementMapper.toResponse(saved);
    }

    public PaiementResponse rejeterPaiement(Long id) {
        Paiement paiement = findOrThrow(id);
        paiement.setStatut(StatutPaiement.REJETE);
        Paiement saved = paiementRepository.save(paiement);

        // Publier événement PaymentRejected
        eventPublisher.publishPaymentRejected(paiementMapper.toEvent(saved));

        return paiementMapper.toResponse(saved);
    }
}
```

### 6.3 API REST

| Méthode | URI | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `POST` | `/api/payments` | Enregistrer un paiement | COMPTABLE |
| `GET` | `/api/payments` | Lister les paiements (paginé) | COMPTABLE |
| `GET` | `/api/payments/{id}` | Consulter un paiement | COMPTABLE |
| `PATCH` | `/api/payments/{id}/validate` | Valider un paiement | COMPTABLE |
| `PATCH` | `/api/payments/{id}/reject` | Rejeter un paiement | COMPTABLE |
| `GET` | `/api/payments/invoice/{id}` | Paiements par facture | COMPTABLE |

### 6.4 Checklist Phase 4

- [ ] `PaiementRepository` avec requêtes custom
- [ ] DTOs de création et réponse
- [ ] `PaiementService` avec toutes les règles métier
- [ ] Validation : montant ≤ resteAPayer
- [ ] Validation : facture en état ENVOYEE ou PARTIELLEMENT_PAYEE
- [ ] Idempotence via referenceTransaction
- [ ] Controller REST avec 6 endpoints
- [ ] Tests unitaires pour les règles de validation

---

## 7. Phase 5 — Module Comptabilité (Accounting)

> **Durée estimée** : Semaine 7–9  
> **Objectif** : Implémenter la comptabilité en partie double et la génération de rapports

### 7.1 Principe de la comptabilité en partie double

Chaque opération financière affecte **au moins deux comptes** : l'un est débité et l'autre est crédité, pour un **montant identique**. Cela garantit l'équation comptable fondamentale :

```
Actif = Passif + Capitaux propres
```

### 7.2 Plan comptable utilisé

| Compte | Libellé | Type |
|--------|---------|------|
| 411000 | Clients | Actif |
| 512000 | Banque | Actif |
| 701000 | Ventes de produits | Produit |
| 445710 | TVA collectée | Passif |

### 7.3 Écritures comptables automatiques

#### Émission d'une facture de 8 880 € TTC (7 400 € HT + 1 480 € TVA)

| Compte | Libellé | Débit | Crédit |
|--------|---------|-------|--------|
| 411000 | Clients | 8 880,00 | — |
| 701000 | Ventes de produits | — | 7 400,00 |
| 445710 | TVA collectée | — | 1 480,00 |
| **Total** | | **8 880,00** | **8 880,00** |

#### Réception du paiement de 8 880 €

| Compte | Libellé | Débit | Crédit |
|--------|---------|-------|--------|
| 512000 | Banque | 8 880,00 | — |
| 411000 | Clients | — | 8 880,00 |
| **Total** | | **8 880,00** | **8 880,00** |

### 7.4 Service

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ComptabiliteService {

    private final JournalTransactionRepository journalRepository;

    /**
     * Enregistre l'écriture comptable pour l'émission d'une facture.
     * Débit 411000 (Clients) / Crédit 701000 (Ventes) + 445710 (TVA collectée)
     */
    public void enregistrerEmissionFacture(Facture facture) {
        // Écriture 1 : Débit Clients / Crédit Ventes (montant HT)
        journalRepository.save(JournalTransaction.builder()
            .compteDebit("411000").compteCredit("701000")
            .debit(facture.getMontantHT()).credit(facture.getMontantHT())
            .description("Émission facture " + facture.getNumero() + " - Ventes HT")
            .typeReference("FACTURE").referenceId(facture.getId())
            .build());

        // Écriture 2 : Débit Clients / Crédit TVA collectée
        if (facture.getTaxe().compareTo(BigDecimal.ZERO) > 0) {
            journalRepository.save(JournalTransaction.builder()
                .compteDebit("411000").compteCredit("445710")
                .debit(facture.getTaxe()).credit(facture.getTaxe())
                .description("Émission facture " + facture.getNumero() + " - TVA")
                .typeReference("FACTURE").referenceId(facture.getId())
                .build());
        }
    }

    /**
     * Enregistre l'écriture comptable pour la réception d'un paiement.
     * Débit 512000 (Banque) / Crédit 411000 (Clients)
     */
    public void enregistrerReceptionPaiement(Paiement paiement) {
        journalRepository.save(JournalTransaction.builder()
            .compteDebit("512000").compteCredit("411000")
            .debit(paiement.getMontant()).credit(paiement.getMontant())
            .description("Paiement reçu - Réf: " + paiement.getReferenceTransaction())
            .typeReference("PAIEMENT").referenceId(paiement.getId())
            .build());
    }
}
```

### 7.5 API REST

| Méthode | URI | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `GET` | `/api/journal` | Consulter le journal (paginé) | COMPTABLE |
| `GET` | `/api/journal/account/{compte}` | Écritures par compte | COMPTABLE |
| `GET` | `/api/reports` | Lister les rapports | GESTIONNAIRE |
| `POST` | `/api/reports/generate` | Générer un rapport | COMPTABLE |
| `GET` | `/api/reports/{id}` | Consulter un rapport | GESTIONNAIRE |

### 7.6 Checklist Phase 5

- [ ] `JournalTransactionRepository` avec recherche par compte et date
- [ ] `ComptabiliteService` avec écritures automatiques
- [ ] Vérification d'équilibre (debit == credit) à chaque écriture
- [ ] `RapportService` pour la génération de rapports
- [ ] Controller REST pour le journal et les rapports
- [ ] Tests unitaires pour la partie double

---

## 8. Phase 6 — Communication événementielle (RabbitMQ)

> **Durée estimée** : Semaine 9–10  
> **Objectif** : Mettre en place la communication asynchrone entre les modules internes et avec les autres microservices

### 8.1 Pourquoi la communication asynchrone ?

Dans un module financier, la cohérence des données entre services est critique. Un appel REST synchrone crée un couplage fort : si le module comptabilité est temporairement indisponible au moment où le module paiement tente de lui envoyer une notification, le paiement risque d'être enregistré sans l'écriture comptable correspondante. Avec RabbitMQ, l'événement est persisté dans une queue et sera consommé dès que le module sera de nouveau disponible.

### 8.2 Configuration RabbitMQ

```java
@Configuration
public class RabbitMQConfig {

    // === Exchanges ===
    public static final String FINANCE_EXCHANGE = "finance.exchange";

    // === Queues ===
    public static final String INVOICE_QUEUE = "finance.invoices";
    public static final String PAYMENT_QUEUE = "finance.payments";
    public static final String ACCOUNTING_QUEUE = "finance.accounting";

    // === Routing Keys ===
    public static final String INVOICE_CREATED_KEY = "invoice.created";
    public static final String INVOICE_VALIDATED_KEY = "invoice.validated";
    public static final String INVOICE_CANCELLED_KEY = "invoice.cancelled";
    public static final String PAYMENT_RECEIVED_KEY = "payment.received";
    public static final String PAYMENT_VALIDATED_KEY = "payment.validated";
    public static final String PAYMENT_REJECTED_KEY = "payment.rejected";

    @Bean
    public TopicExchange financeExchange() {
        return new TopicExchange(FINANCE_EXCHANGE);
    }

    @Bean
    public Queue invoiceQueue() { return new Queue(INVOICE_QUEUE, true); }

    @Bean
    public Queue paymentQueue() { return new Queue(PAYMENT_QUEUE, true); }

    @Bean
    public Queue accountingQueue() { return new Queue(ACCOUNTING_QUEUE, true); }

    @Bean
    public Binding invoiceBinding() {
        return BindingBuilder.bind(invoiceQueue())
            .to(financeExchange()).with("invoice.*");
    }

    @Bean
    public Binding paymentBinding() {
        return BindingBuilder.bind(paymentQueue())
            .to(financeExchange()).with("payment.*");
    }

    @Bean
    public Binding accountingBinding() {
        return BindingBuilder.bind(accountingQueue())
            .to(financeExchange()).with("#");  // Reçoit tout
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

### 8.3 Structure d'un événement

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FinanceEvent {
    private String eventId;          // UUID unique
    private String eventType;        // "InvoiceCreated", "PaymentReceived", etc.
    private LocalDateTime timestamp;
    private String correlationId;    // Pour le traçage distribué
    private Object payload;          // Données spécifiques à l'événement
}
```

### 8.4 Producteur

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishInvoiceCreated(InvoiceEvent event) {
        publish(INVOICE_CREATED_KEY, "InvoiceCreated", event);
    }

    public void publishPaymentReceived(PaymentEvent event) {
        publish(PAYMENT_RECEIVED_KEY, "PaymentReceived", event);
    }

    public void publishPaymentValidated(PaymentEvent event) {
        publish(PAYMENT_VALIDATED_KEY, "PaymentValidated", event);
    }

    public void publishPaymentRejected(PaymentEvent event) {
        publish(PAYMENT_REJECTED_KEY, "PaymentRejected", event);
    }

    private void publish(String routingKey, String eventType, Object payload) {
        FinanceEvent event = FinanceEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(eventType)
            .timestamp(LocalDateTime.now())
            .correlationId(MDC.get("correlationId"))
            .payload(payload)
            .build();

        log.info("Publishing event: {} with key: {}", eventType, routingKey);
        rabbitTemplate.convertAndSend(FINANCE_EXCHANGE, routingKey, event);
    }
}
```

### 8.5 Consommateur

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceEventConsumer {

    private final FactureService factureService;
    private final ComptabiliteService comptabiliteService;

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void onPaymentEvent(FinanceEvent event) {
        log.info("Received event: {}", event.getEventType());

        switch (event.getEventType()) {
            case "PaymentValidated" -> {
                PaymentEvent payload = (PaymentEvent) event.getPayload();
                // 1. Mettre à jour la facture
                factureService.appliquerPaiement(payload.getFactureId(), payload.getMontant());
                // 2. Créer l'écriture comptable
                comptabiliteService.enregistrerReceptionPaiement(payload);
            }
            case "PaymentRejected" -> {
                // Contrepassation si nécessaire
                log.warn("Payment rejected: {}", event.getPayload());
            }
        }
    }

    @RabbitListener(queues = RabbitMQConfig.INVOICE_QUEUE)
    public void onInvoiceEvent(FinanceEvent event) {
        log.info("Received invoice event: {}", event.getEventType());

        if ("InvoiceValidated".equals(event.getEventType())) {
            InvoiceEvent payload = (InvoiceEvent) event.getPayload();
            comptabiliteService.enregistrerEmissionFacture(payload);
        }
    }
}
```

### 8.6 Tableau récapitulatif des événements

| Événement | Routing Key | Producteur | Consommateurs |
|-----------|-------------|------------|---------------|
| InvoiceCreated | `invoice.created` | Module Facturation | Module Comptabilité |
| InvoiceValidated | `invoice.validated` | Module Facturation | Module Comptabilité |
| InvoiceCancelled | `invoice.cancelled` | Module Facturation | Module Comptabilité, Module Paiement |
| PaymentReceived | `payment.received` | Module Paiement | Module Facturation, Module Comptabilité |
| PaymentValidated | `payment.validated` | Module Paiement | Module Facturation, Module Comptabilité |
| PaymentRejected | `payment.rejected` | Module Paiement | Module Facturation |

### 8.7 Checklist Phase 6

- [ ] Configuration RabbitMQ (exchanges, queues, bindings)
- [ ] `FinanceEventPublisher` avec tous les événements
- [ ] `FinanceEventConsumer` avec traitement de chaque événement
- [ ] Sérialisation JSON des événements
- [ ] Tests avec RabbitMQ Testcontainer
- [ ] Vérification que les écritures comptables sont créées automatiquement

---

## 9. Phase 7 — Sécurité (JWT / RBAC)

> **Durée estimée** : Semaine 10–11  
> **Objectif** : Intégrer l'authentification JWT avec le auth-service existant et le contrôle d'accès RBAC

### 9.1 Intégration avec le auth-service (PHP/Symfony)

Le auth-service existant émet des jetons JWT. Le finance-service doit les valider.

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter())))
            .authorizeHttpRequests(auth -> auth
                // Endpoints publics
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Endpoints protégés
                .requestMatchers("/api/**").authenticated()
                .anyRequest().denyAll()
            );
        return http.build();
    }

    private JwtAuthenticationConverter jwtAuthConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter authConverter = new JwtAuthenticationConverter();
        authConverter.setJwtGrantedAuthoritiesConverter(converter);
        return authConverter;
    }
}
```

### 9.2 Matrice des autorisations RBAC

| Action | ADMIN | COMPTABLE | GESTIONNAIRE |
|--------|:-----:|:---------:|:------------:|
| Créer une facture | ✅ | ✅ | ❌ |
| Valider une facture | ✅ | ✅ | ❌ |
| Supprimer une facture | ✅ | ❌ | ❌ |
| Enregistrer un paiement | ✅ | ✅ | ❌ |
| Valider un paiement | ✅ | ✅ | ❌ |
| Consulter le journal | ✅ | ✅ | ❌ |
| Générer un rapport | ✅ | ✅ | ❌ |
| Consulter les rapports | ✅ | ✅ | ✅ |
| Consulter les dashboards | ✅ | ✅ | ✅ |

### 9.3 Checklist Phase 7

- [ ] `SecurityConfig` avec validation JWT
- [ ] `@PreAuthorize` sur chaque endpoint
- [ ] Extraction du userId depuis le JWT
- [ ] Tests avec `@WithMockUser`
- [ ] Vérification que les endpoints non autorisés retournent 403

---

## 10. Phase 8 — Cache distribué (Redis)

> **Durée estimée** : Semaine 11–12  
> **Objectif** : Optimiser les performances avec le cache Redis

### 10.1 Stratégie de cache

| Donnée | Clé Redis | TTL | Invalidation |
|--------|-----------|-----|-------------|
| Facture individuelle | `invoice:{id}` | 5 min | À chaque modification |
| Liste factures paginée | `invoices:page:{n}:size:{s}` | 2 min | À chaque création/modification |
| Rapport financier | `report:{id}` | 1 h | À la régénération |
| Config TVA | `config:tva` | 24 h | Invalidation manuelle |

### 10.2 Pattern Cache-Aside

Le service vérifie d'abord le cache. En cas de cache miss, il interroge la base de données, puis écrit le résultat dans le cache. En cas de cache hit, la réponse est servie directement depuis Redis, ce qui réduit considérablement la latence (de ~50 ms à ~2 ms).

```java
@Service
public class FactureService {

    @Cacheable(value = "invoices", key = "#id", unless = "#result == null")
    public FactureResponse getFacture(Long id) { ... }

    @CacheEvict(value = "invoices", key = "#id")
    public FactureResponse modifierFacture(Long id, UpdateFactureRequest request) { ... }

    @CacheEvict(value = "invoices", allEntries = true)
    public FactureResponse creerFacture(CreateFactureRequest request, Long userId) { ... }

    @Cacheable(value = "reports", key = "#id")
    public RapportResponse getReport(Long id) { ... }
}
```

### 10.3 Checklist Phase 8

- [ ] Configuration Redis dans `application.yml`
- [ ] `@Cacheable` sur les méthodes de lecture
- [ ] `@CacheEvict` sur les méthodes de modification
- [ ] TTL configuré par type de donnée
- [ ] Tests de performance avant/après cache

---

## 11. Phase 9 — Résilience & Tolérance aux pannes

> **Durée estimée** : Semaine 12–13  
> **Objectif** : Garantir la fiabilité du système même en cas de défaillance partielle

### 11.1 Circuit Breaker (Resilience4j)

Le Circuit Breaker est un patron de conception qui empêche un service de continuer à envoyer des requêtes vers un service défaillant. Il fonctionne comme un disjoncteur électrique :

- **Fermé (Closed)** : Les requêtes passent normalement. Le CB compte les erreurs.
- **Ouvert (Open)** : Après un seuil d'erreurs (ex: 5 consécutives), le circuit s'ouvre. Toutes les requêtes sont rejetées avec un fallback.
- **Semi-ouvert (Half-Open)** : Après un délai (30s), une requête de test passe. Si elle réussit, le circuit se referme.

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      authService:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      rabbitRetry:
        maxAttempts: 3
        waitDuration: 1s
        exponentialBackoffMultiplier: 2
```

### 11.2 Idempotence

Chaque opération est conçue pour être idempotente : exécuter la même opération plusieurs fois produit le même résultat. Cela est crucial lorsque des messages RabbitMQ sont consommés en double. L'idempotence est assurée par la vérification de la `referenceTransaction` unique avant chaque traitement.

### 11.3 Pattern SAGA

Le pattern SAGA résout le problème des transactions distribuées en décomposant la transaction globale en une série de transactions locales, chacune accompagnée d'une action de compensation en cas d'échec.

**Exemple — Enregistrement d'un paiement :**

| Étape | Service | Action | Compensation |
|-------|---------|--------|-------------|
| T1 | Payment | Créer le paiement | C1 : Passer statut à REJETÉ |
| T2 | Invoice | Mettre à jour montantPaye | C2 : Rétablir ancien montant |
| T3 | Accounting | Créer écriture comptable | C3 : Écriture de contrepassation |

### 11.4 Checklist Phase 9

- [ ] Circuit Breaker configuré pour les appels externes
- [ ] Retry avec backoff exponentiel pour RabbitMQ
- [ ] Idempotence via referenceTransaction
- [ ] Fallback methods implémentées
- [ ] Tests de résilience (simuler des pannes)

---

## 12. Phase 10 — Observabilité (Monitoring & Logging)

> **Durée estimée** : Semaine 13–14  
> **Objectif** : Assurer une visibilité complète sur l'état du système en temps réel

### 12.1 Métriques Prometheus

```java
@Component
@RequiredArgsConstructor
public class FinanceMetrics {

    private final MeterRegistry meterRegistry;

    private Counter invoicesCreatedCounter;
    private Counter paymentsReceivedCounter;
    private DistributionSummary paymentAmountSummary;

    @PostConstruct
    public void init() {
        invoicesCreatedCounter = Counter.builder("finance_invoices_created_total")
            .description("Nombre total de factures créées")
            .register(meterRegistry);

        paymentsReceivedCounter = Counter.builder("finance_payments_received_total")
            .description("Nombre total de paiements reçus")
            .register(meterRegistry);

        paymentAmountSummary = DistributionSummary.builder("finance_payments_amount")
            .description("Distribution des montants de paiement")
            .baseUnit("EUR")
            .register(meterRegistry);
    }

    public void incrementInvoicesCreated() { invoicesCreatedCounter.increment(); }
    public void recordPayment(double amount) {
        paymentsReceivedCounter.increment();
        paymentAmountSummary.record(amount);
    }
}
```

### 12.2 Logs structurés JSON

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"service":"finance-service"}</customFields>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="JSON" />
    </root>
</configuration>
```

**Exemple de log structuré :**
```json
{
    "timestamp": "2026-04-15T14:30:00.123Z",
    "level": "INFO",
    "service": "finance-service",
    "correlationId": "corr-abc123",
    "message": "Paiement enregistré avec succès",
    "paymentId": 42,
    "invoiceId": 157,
    "montant": 4440.00,
    "duration_ms": 45
}
```

### 12.3 Checklist Phase 10

- [ ] Endpoint `/actuator/prometheus` exposé
- [ ] Métriques métier custom enregistrées
- [ ] Logs structurés JSON avec correlation ID
- [ ] Fichier `logback-spring.xml` configuré
- [ ] Dashboard Grafana créé (si Grafana disponible)

---

## 13. Phase 11 — Stratégie de Tests

> **Durée estimée** : Semaine 14–15  
> **Objectif** : Assurer une couverture de tests ≥ 80 %

### 13.1 Pyramide de tests

```
        ┌───────────┐
        │  E2E (5%) │
        ├───────────┤
        │Integration│
        │   (20%)   │
        ├───────────┤
        │  Unitaire │
        │   (75%)   │
        └───────────┘
```

### 13.2 Tests unitaires (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class FactureServiceTest {

    @Mock private FactureRepository factureRepository;
    @Mock private FactureMapper factureMapper;
    @Mock private FinanceEventPublisher eventPublisher;
    @InjectMocks private FactureService factureService;

    @Test
    void calculerMontants_devraitCalculerCorrectement() {
        // Given
        Facture facture = new Facture();
        facture.setTauxTVA(new BigDecimal("0.20"));
        facture.getLignes().add(LigneFacture.builder()
            .produit("Produit A").quantite(2)
            .prixUnitaire(new BigDecimal("100.00"))
            .totalLigne(new BigDecimal("200.00")).build());
        facture.getLignes().add(LigneFacture.builder()
            .produit("Produit B").quantite(1)
            .prixUnitaire(new BigDecimal("500.00"))
            .totalLigne(new BigDecimal("500.00")).build());

        // When
        facture.calculerMontants();

        // Then
        assertEquals(new BigDecimal("700.00"), facture.getMontantHT());
        assertEquals(new BigDecimal("140.00"), facture.getTaxe());
        assertEquals(new BigDecimal("840.00"), facture.getMontantTTC());
        assertEquals(new BigDecimal("840.00"), facture.getResteAPayer());
    }

    @Test
    void changerStatut_transitionInvalide_devraitLeverException() {
        // Given : facture en état PAYEE (état terminal)
        Facture facture = Facture.builder().id(1L).statut(StatutFacture.PAYEE).build();
        when(factureRepository.findById(1L)).thenReturn(Optional.of(facture));

        // When & Then
        assertThrows(InvalidStatutTransitionException.class,
            () -> factureService.changerStatut(1L, StatutFacture.BROUILLON));
    }

    @Test
    void enregistrerPaiement_montantExcede_devraitLeverException() {
        // Le montant du paiement dépasse le resteAPayer
        // → MontantExcedeResteAPayerException attendue
    }
}
```

### 13.3 Tests d'intégration (Testcontainers)

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class FinanceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    static GenericContainer<?> redis =
        new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @Container
    static RabbitMQContainer rabbit =
        new RabbitMQContainer("rabbitmq:3-management");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.rabbitmq.host", rabbit::getHost);
        registry.add("spring.rabbitmq.port", rabbit::getAmqpPort);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @Autowired private FactureController factureController;
    @Autowired private PaiementController paiementController;

    @Test
    void scenarioComplet_creationFacture_paiement_ecritureComptable() {
        // 1. Créer une facture
        // 2. Valider la facture
        // 3. Envoyer la facture
        // 4. Enregistrer un paiement partiel
        // 5. Vérifier que la facture est PARTIELLEMENT_PAYEE
        // 6. Enregistrer le solde
        // 7. Vérifier que la facture est PAYEE
        // 8. Vérifier les écritures comptables dans le journal
    }
}
```

### 13.4 Checklist Phase 11

- [ ] Tests unitaires pour `FactureService` (≥ 80 % couverture)
- [ ] Tests unitaires pour `PaiementService`
- [ ] Tests unitaires pour `ComptabiliteService`
- [ ] Tests d'intégration avec Testcontainers
- [ ] Test du scénario complet (facture → paiement → comptabilité)
- [ ] Tests de sécurité (endpoints protégés)
- [ ] Rapport de couverture JaCoCo

---

## 14. Phase 12 — Intégration Gateway & Déploiement

> **Durée estimée** : Semaine 15–16  
> **Objectif** : Intégrer le service dans l'écosystème MAKA et déployer

### 14.1 Configuration Nginx Gateway

Ajouter au fichier `gateway/nginx.conf` :

```nginx
# ===== Finance Service =====
location /api/invoices {
    proxy_pass http://finance-service:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Correlation-Id $request_id;
}

location /api/payments {
    proxy_pass http://finance-service:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Correlation-Id $request_id;
}

location /api/journal {
    proxy_pass http://finance-service:8080;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Correlation-Id $request_id;
}

location /api/reports {
    proxy_pass http://finance-service:8080;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;
    proxy_set_header X-Correlation-Id $request_id;
}

# Swagger UI (dev uniquement)
location /finance/swagger-ui {
    proxy_pass http://finance-service:8080/swagger-ui;
    proxy_set_header Host $host;
}
```

### 14.2 Commandes de déploiement

```bash
# 1. Build du service
cd services/finance-service
mvn clean package -DskipTests

# 2. Build de l'image Docker
docker build -t maka/finance-service:latest .

# 3. Démarrer tout l'écosystème
cd ../
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
docker logs maka-finance-service

# 5. Tester le health check
curl http://localhost:8083/actuator/health

# 6. Tester via le gateway
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost/api/invoices
```

### 14.3 Checklist Phase 12

- [ ] `nginx.conf` mis à jour avec les routes finance
- [ ] `docker-compose.yml` complet avec tous les services
- [ ] `docker-compose up` démarre sans erreur
- [ ] Health check retourne `UP`
- [ ] API accessible via le gateway Nginx
- [ ] Swagger UI accessible
- [ ] Communication RabbitMQ fonctionnelle
- [ ] Cache Redis opérationnel
- [ ] Logs visibles dans la console

---

## 15. Résumé du planning

| Phase | Semaine | Module | Priorité |
|-------|---------|--------|----------|
| **1** | 1–2 | Fondations (Spring Boot, Docker, DB) | 🔴 Critique |
| **2** | 2–3 | Modèle de domaine & Entités JPA | 🔴 Critique |
| **3** | 3–5 | **Module Facturation** (CRUD + machine à états) | 🔴 Critique |
| **4** | 5–7 | **Module Paiement** (règles métier) | 🔴 Critique |
| **5** | 7–9 | **Module Comptabilité** (partie double) | 🔴 Critique |
| **6** | 9–10 | Communication RabbitMQ | 🟡 Important |
| **7** | 10–11 | Sécurité JWT/RBAC | 🟡 Important |
| **8** | 11–12 | Cache Redis | 🟢 Optimisation |
| **9** | 12–13 | Résilience (Circuit Breaker, Retry, SAGA) | 🟡 Important |
| **10** | 13–14 | Observabilité (Prometheus, Logs) | 🟢 Optimisation |
| **11** | 14–15 | Tests (unitaires + intégration) | 🟡 Important |
| **12** | 15–16 | Intégration Gateway & Déploiement | 🔴 Critique |

**Durée totale estimée : 16 semaines (~4 mois)**

---

## 16. Références

1. Richardson, C. (2018). *Microservices Patterns: With Examples in Java*. Manning Publications.
2. Newman, S. (2021). *Building Microservices: Designing Fine-Grained Systems*, 2nd Edition. O'Reilly Media.
3. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.
4. Spring Boot Documentation — https://spring.io/projects/spring-boot
5. PostgreSQL Documentation — https://www.postgresql.org/docs/
6. RabbitMQ Documentation — https://www.rabbitmq.com/documentation.html
7. Redis Documentation — https://redis.io/docs/
8. Resilience4j Documentation — https://resilience4j.readme.io/

---

> 📝 **Note** : Ce document est basé sur le rapport PFE "Conception et Réalisation d'un Microservice Finance & Comptabilité dans une Architecture ERP" et adapté à l'architecture existante du projet MAKA.

---

*Dernière mise à jour : 17 avril 2026*