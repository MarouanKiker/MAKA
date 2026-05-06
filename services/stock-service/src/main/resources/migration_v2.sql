-- =============================================================================
-- MAKA ERP — Migration Stock-Service v1 → v2
-- À exécuter UNE SEULE FOIS sur la base stock_db existante
-- =============================================================================

-- 1. Supprimer la colonne dénormalisée (source d'incohérence)
ALTER TABLE article DROP COLUMN IF EXISTS stock_total_global;

-- 2. Ajouter la colonne unite
ALTER TABLE article ADD COLUMN IF NOT EXISTS unite VARCHAR(20) NOT NULL DEFAULT 'PIECE';

-- 3. Ajouter les colonnes source_type/source_id à mouvement_stock (v2)
ALTER TABLE mouvement_stock ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE mouvement_stock ADD COLUMN IF NOT EXISTS source_id BIGINT;

-- 4. Supprimer les colonnes obsolètes de mouvement_stock (1 mouvement = 1 article était faux)
-- ⚠️ Attention : migrer les données si nécessaire avant de dropper !
ALTER TABLE mouvement_stock DROP COLUMN IF EXISTS quantite;
ALTER TABLE mouvement_stock DROP COLUMN IF EXISTS article_id;

-- 5. Contrainte anti-stock-négatif sur article_stock_depot
ALTER TABLE article_stock_depot DROP CONSTRAINT IF EXISTS chk_quantite_positive;
ALTER TABLE article_stock_depot ADD CONSTRAINT chk_quantite_positive CHECK (quantite >= 0);

-- 6. Nouvelle table : lignes de mouvements (multi-articles par mouvement)
CREATE TABLE IF NOT EXISTS mouvement_stock_line (
    id           BIGSERIAL PRIMARY KEY,
    mouvement_id BIGINT    NOT NULL REFERENCES mouvement_stock(id) ON DELETE CASCADE,
    article_id   BIGINT    NOT NULL REFERENCES article(id) ON DELETE RESTRICT,
    quantite     INT       NOT NULL CHECK (quantite > 0)
);
CREATE INDEX IF NOT EXISTS idx_mvt_line_mouvement ON mouvement_stock_line (mouvement_id);
CREATE INDEX IF NOT EXISTS idx_mvt_line_article   ON mouvement_stock_line (article_id);

-- 7. Nouvelle table : réservations de stock
CREATE TABLE IF NOT EXISTS reservation_stock (
    id          BIGSERIAL   PRIMARY KEY,
    article_id  BIGINT      NOT NULL REFERENCES article(id) ON DELETE CASCADE,
    depot_id    BIGINT      NOT NULL REFERENCES depot(id) ON DELETE RESTRICT,
    quantite    INT         NOT NULL CHECK (quantite > 0),
    source_type VARCHAR(50) NOT NULL,
    source_id   BIGINT      NOT NULL,
    statut      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (statut IN ('ACTIVE','CONSUMED','RELEASED')),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_res_article_depot ON reservation_stock (article_id, depot_id) WHERE statut = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_res_source        ON reservation_stock (source_type, source_id);

-- 8. Nouvelle table : sessions d'inventaire
CREATE TABLE IF NOT EXISTS inventaire (
    id         BIGSERIAL   PRIMARY KEY,
    depot_id   BIGINT      NOT NULL REFERENCES depot(id) ON DELETE RESTRICT,
    statut     VARCHAR(20) NOT NULL DEFAULT 'EN_COURS'
                           CHECK (statut IN ('EN_COURS','VALIDE','ANNULE')),
    date_inv   TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_by BIGINT      NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventaire_depot  ON inventaire (depot_id);
CREATE INDEX IF NOT EXISTS idx_inventaire_statut ON inventaire (statut);

-- 9. Nouvelle table : lignes d'inventaire avec écart calculé
CREATE TABLE IF NOT EXISTS inventaire_line (
    id                BIGSERIAL PRIMARY KEY,
    inventaire_id     BIGINT    NOT NULL REFERENCES inventaire(id) ON DELETE CASCADE,
    article_id        BIGINT    NOT NULL REFERENCES article(id) ON DELETE RESTRICT,
    quantite_systeme  INT       NOT NULL DEFAULT 0,
    quantite_reelle   INT       NOT NULL DEFAULT 0,
    ecart             INT       GENERATED ALWAYS AS (quantite_reelle - quantite_systeme) STORED,
    UNIQUE (inventaire_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_line_inventaire ON inventaire_line (inventaire_id);
CREATE INDEX IF NOT EXISTS idx_inv_line_article    ON inventaire_line (article_id);

-- 10. Table d'audit (optionnelle — traçabilité complète)
CREATE TABLE IF NOT EXISTS audit_log (
    id             BIGSERIAL   PRIMARY KEY,
    entity_type    VARCHAR(50) NOT NULL,
    entity_id      BIGINT      NOT NULL,
    action         VARCHAR(20) NOT NULL,
    utilisateur_id BIGINT,
    detail         TEXT,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_log (created_at DESC);

-- Vérification finale
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
