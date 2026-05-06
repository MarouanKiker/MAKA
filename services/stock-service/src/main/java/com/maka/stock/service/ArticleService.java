package com.maka.stock.service;

import com.maka.stock.dto.CreateArticleDto;
import com.maka.stock.model.Article;
import com.maka.stock.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Service de gestion des articles (v2).
 * delete() : vérifie les dépendances avant de supprimer pour éviter les erreurs FK.
 * stockTotal est calculé dynamiquement (plus de stock_total_global).
 */
@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepo;

    public Map<String, Object> getAll(String search, int page, int size) {
        List<Article> items = articleRepo.findAll(search, page, size);
        items.forEach(a -> a.setStockTotal(articleRepo.getStockTotal(a.getId())));
        int total = articleRepo.countAll(search);
        return Map.of(
                "data", items,
                "total", total,
                "page", page,
                "pageSize", size,
                "totalPages", (int) Math.ceil((double) total / size)
        );
    }

    public Article getById(Long id) {
        Article article = articleRepo.findById(id)
                .orElseThrow(() -> new EmptyResultDataAccessException("Article " + id + " introuvable", 1));
        article.setStockTotal(articleRepo.getStockTotal(id));
        return article;
    }

    @Transactional
    public Article create(CreateArticleDto dto) {
        Article article = Article.builder()
                .reference(dto.getReference())
                .designation(dto.getDesignation())
                .description(dto.getDescription())
                .unite(dto.getUnite() != null ? dto.getUnite() : "PIECE")
                .prixAchat(dto.getPrixAchat())
                .prixVente(dto.getPrixVente())
                .seuilMinAlerte(dto.getSeuilMinAlerte())
                .emplacementRayon(dto.getEmplacementRayon())
                .categorieId(dto.getCategorieId())
                .build();
        return articleRepo.save(article);
    }

    @Transactional
    public Article update(Long id, CreateArticleDto dto) {
        getById(id);
        Article article = Article.builder()
                .designation(dto.getDesignation())
                .description(dto.getDescription())
                .unite(dto.getUnite() != null ? dto.getUnite() : "PIECE")
                .prixAchat(dto.getPrixAchat())
                .prixVente(dto.getPrixVente())
                .seuilMinAlerte(dto.getSeuilMinAlerte())
                .emplacementRayon(dto.getEmplacementRayon())
                .categorieId(dto.getCategorieId())
                .build();
        return articleRepo.update(id, article)
                .orElseThrow(() -> new EmptyResultDataAccessException("Article " + id + " introuvable", 1));
    }

    /**
     * Suppression sécurisée d'un article.
     * Vérifie d'abord si l'article est utilisé dans des mouvements.
     * Si oui → erreur métier claire (pas de 500).
     * Si non → supprime d'abord le stock par dépôt, puis l'article.
     */
    @Transactional
    public void delete(Long id) {
        // 1. Vérifier l'existence
        getById(id);

        // 2. Vérifier les mouvements
        int nbMouvements = articleRepo.countMouvementsForArticle(id);
        if (nbMouvements > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer l'article : il est référencé dans " + nbMouvements
                    + " mouvement(s). Archivez les mouvements ou choisissez un autre article."
            );
        }

        // 3. Vérifier les réservations actives
        int nbReservations = articleRepo.countReservationsActivesForArticle(id);
        if (nbReservations > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer l'article : il a " + nbReservations
                    + " réservation(s) active(s). Libérez-les d'abord."
            );
        }

        // 4. Supprimer les données dépendantes sans mouvements (stock par dépôt, lignes inventaire)
        articleRepo.deleteStockDepot(id);
        articleRepo.deleteInventaireLines(id);
        articleRepo.deleteReservations(id);

        // 5. Supprimer l'article
        if (!articleRepo.delete(id)) {
            throw new EmptyResultDataAccessException("Article " + id + " introuvable", 1);
        }
    }

    public List<Article> getAlertes() {
        return articleRepo.findAlertes();
    }

    public List<Map<String, Object>> getStockByDepot(Long articleId) {
        return articleRepo.getStockByDepot(articleId);
    }

    public int getStockDisponible(Long articleId, Long depotId) {
        return articleRepo.getStockDisponible(articleId, depotId);
    }
}
