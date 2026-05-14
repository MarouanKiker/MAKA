package com.maka.stock.service;

// =============================================================================
// TEST 3 — Test de Règle Métier : Protection contre le Stock Négatif
//
// Classe testée : MouvementStockService (méthode enregistrerMouvement)
// Règle métier N°1 du service (commentée dans le code) :
//   "Stock jamais négatif (vérifié avant INSERT + contrainte DB)"
//
// On simule les dépendances avec Mockito (ArticleRepository, MouvementStockRepository)
// pour tester UNIQUEMENT la logique de validation dans validateStock().
//
// IMPORTANT : CreateMouvementDto utilise @Data (Lombok) → on utilise les setters.
// Aucune base de données n'est impliquée — test 100% unitaire.
// =============================================================================

import com.maka.stock.dto.CreateMouvementDto;
import com.maka.stock.model.Article;
import com.maka.stock.model.MouvementStock;
import com.maka.stock.repository.ArticleRepository;
import com.maka.stock.repository.MouvementStockRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MouvementStockService — Règles métier de protection du stock")
class MouvementStockServiceExceptionTest {

    @Mock
    private MouvementStockRepository mvtRepo;

    @Mock
    private ArticleRepository articleRepo;

    // Un faux token JWT (nécessaire pour enregistrerMouvement, non testé ici)
    @Mock
    private Jwt jwtToken;

    @InjectMocks
    private MouvementStockService mouvementStockService;

    // IDs fictifs pour les tests
    private static final Long ARTICLE_ID = 10L;
    private static final Long DEPOT_ID   = 1L;

    // =========================================================================
    // Méthode utilitaire : construit un CreateMouvementDto via setters Lombok (@Data)
    // CreateMouvementDto n'a PAS @Builder → on utilise new + setters
    // =========================================================================
    private CreateMouvementDto buildDto(String typeMvt, Long articleId,
                                        Long depotSource, Long depotDest, int quantite, String motif) {
        CreateMouvementDto dto = new CreateMouvementDto();
        dto.setTypeMvt(typeMvt);
        dto.setArticleId(articleId);
        dto.setDepotSourceId(depotSource);
        dto.setDepotDestinationId(depotDest);
        dto.setQuantite(quantite);
        dto.setMotif(motif);
        return dto;
    }

    // =========================================================================
    // Test 3.1 : SORTIE avec stock INSUFFISANT → doit lever IllegalStateException
    // Règle métier : "Stock insuffisant dans le dépôt. Disponible: X, Demandé: Y"
    // =========================================================================
    @Test
    @DisplayName("SORTIE refusée : stock disponible (5) < quantité demandée (10)")
    void sortie_doitLeverException_quandStockInsuffisant() {
        // GIVEN — L'article existe (simulé sans BD par Mockito)
        Article articleExistant = Article.builder()
                .id(ARTICLE_ID)
                .reference("ART-001")
                .designation("Câble Ethernet Cat6")
                .build();
        when(articleRepo.findById(ARTICLE_ID)).thenReturn(Optional.of(articleExistant));

        // GIVEN — Seulement 5 unités disponibles dans le dépôt (stock_physique - réservations)
        when(articleRepo.getStockDisponible(ARTICLE_ID, DEPOT_ID)).thenReturn(5);

        // GIVEN — La demande porte sur 10 unités (SORTIE = retrait du stock)
        // 10 > 5 → la règle métier doit bloquer
        CreateMouvementDto dto = buildDto("SORTIE", ARTICLE_ID, DEPOT_ID, null, 10, "Livraison client");

        // WHEN & THEN — On s'attend à une IllegalStateException avec un message précis
        assertThatThrownBy(() -> mouvementStockService.enregistrerMouvement(dto, jwtToken))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Stock insuffisant")
            .hasMessageContaining("Disponible: 5")
            .hasMessageContaining("Demandé: 10");
    }

    // =========================================================================
    // Test 3.2 : SORTIE avec stock SUFFISANT → aucune exception levée
    // Vérifie le "chemin heureux" (happy path) de la validation
    // =========================================================================
    @Test
    @DisplayName("SORTIE acceptée : stock disponible (50) >= quantité demandée (10)")
    void sortie_doitReussir_quandStockSuffisant() {
        // GIVEN — L'article existe
        Article articleExistant = Article.builder()
                .id(ARTICLE_ID)
                .reference("ART-001")
                .designation("Câble Ethernet Cat6")
                .build();
        when(articleRepo.findById(ARTICLE_ID)).thenReturn(Optional.of(articleExistant));

        // GIVEN — 50 unités disponibles — largement suffisant
        when(articleRepo.getStockDisponible(ARTICLE_ID, DEPOT_ID)).thenReturn(50);

        // GIVEN — Le repo retourne un mouvement valide (simulé)
        MouvementStock mvtSave = MouvementStock.builder().id(99L).statut("VALIDE").build();
        when(mvtRepo.save(any())).thenReturn(mvtSave);

        // 10 <= 50 → doit passer sans exception
        CreateMouvementDto dto = buildDto("SORTIE", ARTICLE_ID, DEPOT_ID, null, 10, "Livraison client");

        // WHEN & THEN — On vérifie qu'AUCUNE exception n'est levée
        assertThatCode(() -> mouvementStockService.enregistrerMouvement(dto, jwtToken))
            .doesNotThrowAnyException();
    }

    // =========================================================================
    // Test 3.3 : SORTIE sans depotSourceId → doit lever IllegalArgumentException
    // Règle métier : "depot_source_id requis pour SORTIE/TRANSFERT"
    // =========================================================================
    @Test
    @DisplayName("SORTIE sans dépôt source → IllegalArgumentException")
    void sortie_doitLeverException_quandDepotSourceAbsent() {
        // GIVEN — L'article existe
        Article articleExistant = Article.builder().id(ARTICLE_ID).reference("ART-002").build();
        when(articleRepo.findById(ARTICLE_ID)).thenReturn(Optional.of(articleExistant));

        // GIVEN — depotSourceId est null (champ oublié dans la requête HTTP)
        CreateMouvementDto dto = buildDto("SORTIE", ARTICLE_ID, null, null, 5, null);

        // WHEN & THEN — La méthode validateStock() doit lever une exception claire
        assertThatThrownBy(() -> mouvementStockService.enregistrerMouvement(dto, jwtToken))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("depot_source_id requis");
    }

    // =========================================================================
    // Test 3.4 : ENTREE (cas normal) → aucune vérification de stock requise
    // Une ENTREE augmente le stock, elle ne peut pas créer de stock négatif.
    // =========================================================================
    @Test
    @DisplayName("ENTREE acceptée directement sans vérification de stock")
    void entree_doitReussir_sansVerificationDeStock() {
        // GIVEN — L'article existe
        Article articleExistant = Article.builder().id(ARTICLE_ID).reference("ART-003").build();
        when(articleRepo.findById(ARTICLE_ID)).thenReturn(Optional.of(articleExistant));

        // GIVEN — Le repo retourne un mouvement valide
        MouvementStock mvtSave = MouvementStock.builder().id(1L).statut("VALIDE").typeMvt("ENTREE").build();
        when(mvtRepo.save(any())).thenReturn(mvtSave);

        // ENTREE vers le dépôt destination — pas de dépôt source nécessaire
        CreateMouvementDto dto = buildDto("ENTREE", ARTICLE_ID, null, DEPOT_ID, 50, "Réception fournisseur");

        // WHEN & THEN — ENTREE ne passe pas par validateStock() → aucune exception
        // Cela est explicitement codé : if ("ENTREE".equals(dto.getTypeMvt())) return;
        assertThatCode(() -> mouvementStockService.enregistrerMouvement(dto, jwtToken))
            .doesNotThrowAnyException();
    }
}
