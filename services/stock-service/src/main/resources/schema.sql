-- =============================================================================
-- MAKA ERP — Stock-Service : Schéma PostgreSQL 16 (Enterprise Edition)
-- Version: 2.0 — Architecture SAP/Odoo-like, JDBC pur, hautes performances
-- =============================================================================

-- ─── Table : categorie ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorie (
    id          BIGSERIAL    PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ─── Table : depot ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS depot (
    id            BIGSERIAL    PRIMARY KEY,
    nom           VARCHAR(150) NOT NULL UNIQUE,
    adresse       TEXT,
    capacite_max  INT          NOT NULL DEFAULT 0,
    date_creation TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── Table : article ─────────────────────────────────────────────────────────
-- ⚠️  stock_total_global SUPPRIMÉ : source d'incohérence.
--     La quantité globale = SUM(quantite) FROM article_stock_depot WHERE article_id = ?
CREATE TABLE IF NOT EXISTS article (
    id                BIGSERIAL     PRIMARY KEY,
    reference         VARCHAR(60)   NOT NULL UNIQUE,
    designation       VARCHAR(200)  NOT NULL,
    description       TEXT,
    unite             VARCHAR(20)   NOT NULL DEFAULT 'PIECE',  -- PIECE, KG, LITRE, M, M2
    prix_achat        NUMERIC(12,2) NOT NULL DEFAULT 0,
    prix_vente        NUMERIC(12,2) NOT NULL DEFAULT 0,
    seuil_min_alerte  INT           NOT NULL DEFAULT 0,
    emplacement_rayon VARCHAR(50),
    categorie_id      BIGINT        REFERENCES categorie(id) ON DELETE SET NULL,
    date_creation     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_designation
    ON article USING gin(to_tsvector('simple', designation));

-- ─── Table : article_stock_depot ─────────────────────────────────────────────
-- Source unique de vérité pour le stock physique par (article, dépôt).
-- Le stock d'un article = SUM de toutes ses lignes ici.
CREATE TABLE IF NOT EXISTS article_stock_depot (
    article_id   BIGINT NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    depot_id     BIGINT NOT NULL REFERENCES depot(id) ON DELETE CASCADE,
    quantite     INT    NOT NULL DEFAULT 0 CHECK (quantite >= 0),  -- Jamais négatif au niveau DB
    PRIMARY KEY (article_id, depot_id)
);

CREATE INDEX IF NOT EXISTS idx_asd_depot ON article_stock_depot (depot_id);

-- ─── Table : mouvement_stock (Header — refactorisé) ──────────────────────────
-- Un mouvement = un bon de livraison, un bon de réception, etc.
-- Il contient plusieurs lignes (mouvement_stock_line).
CREATE TABLE IF NOT EXISTS mouvement_stock (
    id           BIGSERIAL   PRIMARY KEY,
    type_mvt     VARCHAR(20) NOT NULL CHECK (type_mvt IN ('ENTREE','SORTIE','TRANSFERT')),
    source_type  VARCHAR(50) CHECK (source_type IN ('VENTE','ACHAT','INVENTAIRE','RETOUR','MANUEL', NULL)),
    source_id    BIGINT,                      -- ID externe (ex: commande CRM, bon d'achat)
    statut       VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
                             CHECK (statut IN ('BROUILLON','VALIDE','ANNULE')),
    depot_source_id      BIGINT REFERENCES depot(id) ON DELETE RESTRICT,
    depot_destination_id BIGINT REFERENCES depot(id) ON DELETE RESTRICT,
    utilisateur_id       BIGINT NOT NULL,     -- Extrait du JWT, pas de FK externe
    motif                TEXT,
    date_mouvement       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index de consultation historique et filtrage par dépôt
CREATE INDEX IF NOT EXISTS idx_mvt_date       ON mouvement_stock (date_mouvement DESC);
CREATE INDEX IF NOT EXISTS idx_mvt_statut     ON mouvement_stock (statut);
CREATE INDEX IF NOT EXISTS idx_mvt_source     ON mouvement_stock (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_mvt_depot_src  ON mouvement_stock (depot_source_id);
CREATE INDEX IF NOT EXISTS idx_mvt_depot_dest ON mouvement_stock (depot_destination_id);

-- ─── Table : mouvement_stock_line ────────────────────────────────────────────
-- Une ligne = un article + sa quantité dans un mouvement (1 mouvement → N lignes).
-- Ceci remplace le couplage 1 mouvement = 1 article de la v1.
CREATE TABLE IF NOT EXISTS mouvement_stock_line (
    id           BIGSERIAL PRIMARY KEY,
    mouvement_id BIGINT    NOT NULL REFERENCES mouvement_stock(id) ON DELETE CASCADE,
    article_id   BIGINT    NOT NULL REFERENCES article(id) ON DELETE RESTRICT,
    quantite     INT       NOT NULL CHECK (quantite > 0)
);

CREATE INDEX IF NOT EXISTS idx_mvt_line_mouvement ON mouvement_stock_line (mouvement_id);
CREATE INDEX IF NOT EXISTS idx_mvt_line_article   ON mouvement_stock_line (article_id);

-- ─── Table : reservation_stock ───────────────────────────────────────────────
-- Réserve du stock pour une commande avant sa validation effective.
-- Cycle: ACTIVE → CONSUMED (mouvement créé) | RELEASED (annulation)
CREATE TABLE IF NOT EXISTS reservation_stock (
    id          BIGSERIAL   PRIMARY KEY,
    article_id  BIGINT      NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    depot_id    BIGINT      NOT NULL REFERENCES depot(id) ON DELETE RESTRICT,
    quantite    INT         NOT NULL CHECK (quantite > 0),
    source_type VARCHAR(50) NOT NULL,   -- VENTE, ACHAT, ...
    source_id   BIGINT      NOT NULL,   -- ID de la commande dans le service source
    statut      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (statut IN ('ACTIVE','CONSUMED','RELEASED')),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Index critique : trouver rapidement les réservations actives par article/dépôt
CREATE INDEX IF NOT EXISTS idx_res_article_depot ON reservation_stock (article_id, depot_id) WHERE statut = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_res_source        ON reservation_stock (source_type, source_id);

-- ─── Table : inventaire ──────────────────────────────────────────────────────
-- Représente une session de comptage physique pour un dépôt.
CREATE TABLE IF NOT EXISTS inventaire (
    id        BIGSERIAL   PRIMARY KEY,
    depot_id  BIGINT      NOT NULL REFERENCES depot(id) ON DELETE RESTRICT,
    statut    VARCHAR(20) NOT NULL DEFAULT 'EN_COURS' CHECK (statut IN ('EN_COURS','VALIDE','ANNULE')),
    date_inv  TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT     NOT NULL   -- utilisateur_id JWT
);

CREATE INDEX IF NOT EXISTS idx_inventaire_depot  ON inventaire (depot_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_statut ON inventaire (statut);

-- ─── Table : inventaire_line ─────────────────────────────────────────────────
-- Détail article par article lors d'un comptage.
-- ecart = quantite_reelle - quantite_systeme → si positif : surplus, négatif : manque
CREATE TABLE IF NOT EXISTS inventaire_line (
    id                BIGSERIAL PRIMARY KEY,
    inventaire_id     BIGINT    NOT NULL REFERENCES inventaire(id) ON DELETE CASCADE,
    article_id        BIGINT    NOT NULL REFERENCES article(id) ON DELETE RESTRICT,
    quantite_systeme  INT       NOT NULL DEFAULT 0,  -- Lu depuis article_stock_depot au moment du comptage
    quantite_reelle   INT       NOT NULL DEFAULT 0,  -- Saisi par le magasinier
    ecart             INT       GENERATED ALWAYS AS (quantite_reelle - quantite_systeme) STORED,
    UNIQUE (inventaire_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_line_inventaire ON inventaire_line (inventaire_id);
CREATE INDEX IF NOT EXISTS idx_inv_line_article    ON inventaire_line (article_id);

-- ─── Table : audit_log ───────────────────────────────────────────────────────
-- Traçabilité immuable de chaque action critique (INSERT ONLY, jamais de UPDATE/DELETE).
CREATE TABLE IF NOT EXISTS audit_log (
    id            BIGSERIAL   PRIMARY KEY,
    entity_type   VARCHAR(50) NOT NULL,  -- ARTICLE, MOUVEMENT, RESERVATION, INVENTAIRE
    entity_id     BIGINT      NOT NULL,
    action        VARCHAR(20) NOT NULL,  -- CREATE, UPDATE, DELETE, VALIDATE, CANCEL
    utilisateur_id BIGINT,
    detail        TEXT,                  -- JSON ou description lisible de l'action
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_log (created_at DESC);
