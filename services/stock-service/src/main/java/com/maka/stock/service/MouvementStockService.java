package com.maka.stock.service;

import com.maka.stock.dto.CreateMouvementDto;
import com.maka.stock.model.Article;
import com.maka.stock.model.MouvementStock;
import com.maka.stock.model.MouvementStockLine;
import com.maka.stock.repository.ArticleRepository;
import com.maka.stock.repository.MouvementStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Service de gestion des mouvements de stock (v2).
 *
 * Architecture multi-lignes :
 * - Un mouvement (header) contient N lignes d'articles
 * - La validation applique les effets de stock en batch
 * - source_type / source_id permettent la traçabilité inter-services (CRM, Ventes)
 *
 * Règles métier :
 * 1. Stock jamais négatif (vérifié avant INSERT + contrainte DB)
 * 2. TRANSFERT = atomique : débit source ET crédit destination dans la même TX
 * 3. Mouvements d'inventaire créés via createAjustement()
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MouvementStockService {

    private final MouvementStockRepository mvtRepo;
    private final ArticleRepository articleRepo;

    /**
     * Crée et valide immédiatement un mouvement simple (1 article).
     * Compatibilité ascendante avec l'API v1.
     */
    @Transactional
    public MouvementStock enregistrerMouvement(CreateMouvementDto dto, Jwt currentUser) {
        Long userId = extractUserId(currentUser);

        // 1. Vérifier que l'article existe
        Article article = articleRepo.findById(dto.getArticleId())
                .orElseThrow(() -> new EmptyResultDataAccessException(
                        "Article " + dto.getArticleId() + " introuvable", 1));

        // 2. Vérification anti-stock-négatif selon le type
        validateStock(dto);

        // 3. Créer le mouvement header
        MouvementStock mvt = MouvementStock.builder()
                .typeMvt(dto.getTypeMvt())
                .sourceType(dto.getSourceType() != null ? dto.getSourceType() : "MANUEL")
                .sourceId(dto.getSourceId())
                .statut("VALIDE")
                .depotSourceId(dto.getDepotSourceId())
                .depotDestinationId(dto.getDepotDestinationId())
                .utilisateurId(userId)
                .motif(dto.getMotif())
                .build();
        MouvementStock saved = mvtRepo.save(mvt);

        // 4. Ajouter la ligne
        mvtRepo.addLine(saved.getId(), dto.getArticleId(), dto.getQuantite());

        // 5. Appliquer les effets sur le stock par dépôt
        appliquerEffets(dto.getTypeMvt(), dto.getArticleId(),
                dto.getDepotSourceId(), dto.getDepotDestinationId(), dto.getQuantite());

        log.info("[MOUVEMENT] Créé id={} type={} article={} qte={}",
                saved.getId(), dto.getTypeMvt(), dto.getArticleId(), dto.getQuantite());
        return saved;
    }

    /**
     * Valide un mouvement en BROUILLON et applique ses effets de stock.
     * Pour les mouvements multi-lignes créés en mode BROUILLON.
     */
    @Transactional
    public MouvementStock valider(Long mouvementId) {
        MouvementStock mvt = mvtRepo.findById(mouvementId)
                .orElseThrow(() -> new IllegalArgumentException("Mouvement " + mouvementId + " introuvable"));

        if (!"BROUILLON".equals(mvt.getStatut())) {
            throw new IllegalStateException("Le mouvement est déjà au statut : " + mvt.getStatut());
        }

        // Appliquer les effets pour chaque ligne
        List<MouvementStockLine> lines = mvtRepo.findLines(mouvementId);
        for (MouvementStockLine line : lines) {
            appliquerEffets(mvt.getTypeMvt(), line.getArticleId(),
                    mvt.getDepotSourceId(), mvt.getDepotDestinationId(), line.getQuantite());
        }

        mvtRepo.valider(mouvementId);
        log.info("[MOUVEMENT] Validé id={} avec {} lignes", mouvementId, lines.size());
        return mvtRepo.findById(mouvementId).orElseThrow();
    }

    // ── Lecture ───────────────────────────────────────────────────────────────
    public Map<String, Object> getAll(int page, int size) {
        List<MouvementStock> items = mvtRepo.findAll(page, size);
        int total = mvtRepo.countAll();
        return Map.of("data", items, "total", total, "page", page,
                "pageSize", size, "totalPages", (int) Math.ceil((double) total / size));
    }

    public Map<String, Object> getHistorique(Long articleId, int page, int size) {
        List<MouvementStock> items = mvtRepo.findByArticleId(articleId, page, size);
        return Map.of("data", items, "page", page, "pageSize", size);
    }

    public List<MouvementStockLine> getLignes(Long mouvementId) {
        return mvtRepo.findLines(mouvementId);
    }

    @Transactional
    public void annuler(Long mouvementId) {
        MouvementStock mvt = mvtRepo.findById(mouvementId)
                .orElseThrow(() -> new IllegalArgumentException("Mouvement " + mouvementId + " introuvable"));
        if ("VALIDE".equals(mvt.getStatut())) {
            throw new IllegalArgumentException("Impossible d'annuler un mouvement VALIDE. Créez un mouvement inverse.");
        }
        mvtRepo.annuler(mouvementId);
        log.info("[MOUVEMENT] Annulé id={}", mouvementId);
    }

    // ── Méthodes privées ──────────────────────────────────────────────────────

    /**
     * Applique les effets de stock dans article_stock_depot selon le type de mouvement.
     * Tout est JDBC+UPSERT, atomique dans la transaction parente.
     */
    private void appliquerEffets(String typeMvt, Long articleId,
                                 Long depotSourceId, Long depotDestinationId, int quantite) {
        switch (typeMvt) {
            case "ENTREE" -> {
                // Crédit du dépôt destination uniquement
                articleRepo.updateStockDepot(articleId, depotDestinationId, quantite);
            }
            case "SORTIE" -> {
                // Débit du dépôt source uniquement
                articleRepo.updateStockDepot(articleId, depotSourceId, -quantite);
            }
            case "TRANSFERT" -> {
                // Débit source + Crédit destination — atomique dans la même transaction
                articleRepo.updateStockDepot(articleId, depotSourceId, -quantite);
                articleRepo.updateStockDepot(articleId, depotDestinationId, quantite);
            }
            default -> throw new IllegalArgumentException("Type inconnu: " + typeMvt);
        }
    }

    /**
     * Vérifie que le stock disponible est suffisant avant d'exécuter une SORTIE ou TRANSFERT.
     * Utilise le stock disponible = stock physique - réservations actives.
     */
    private void validateStock(CreateMouvementDto dto) {
        if ("ENTREE".equals(dto.getTypeMvt())) return; // Pas de vérification nécessaire

        Long depotSource = dto.getDepotSourceId();
        if (depotSource == null) {
            throw new IllegalArgumentException("depot_source_id requis pour SORTIE/TRANSFERT");
        }

        int disponible = articleRepo.getStockDisponible(dto.getArticleId(), depotSource);
        if (disponible < dto.getQuantite()) {
            throw new IllegalStateException(
                    String.format("Stock insuffisant dans le dépôt. Disponible: %d, Demandé: %d",
                            disponible, dto.getQuantite()));
        }
    }

    private Long extractUserId(Jwt jwt) {
        Object sub = jwt.getClaim("sub");
        if (sub == null) return 0L;
        try { return Long.parseLong(sub.toString()); }
        catch (NumberFormatException e) { return 0L; }
    }
}
