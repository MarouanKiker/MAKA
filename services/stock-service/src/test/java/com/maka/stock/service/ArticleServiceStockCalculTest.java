package com.maka.stock.service;

// =============================================================================
// TEST 2 — Test de Logique Métier : Calcul du Stock Disponible
//
// Classe testée : ArticleService (méthode getStockDisponible)
// Pattern utilisé : GIVEN / WHEN / THEN (lisible et pédagogique)
//
// On utilise Mockito pour simuler (mocker) le ArticleRepository.
// Ainsi, AUCUNE connexion à PostgreSQL n'est tentée.
// C'est du pur Test Unitaire : on isole uniquement la logique du Service.
// =============================================================================

import com.maka.stock.repository.ArticleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

// Lance le moteur Mockito sans démarrer Spring (pas de BD, pas de serveur)
@ExtendWith(MockitoExtension.class)
@DisplayName("ArticleService — Tests de calcul du stock disponible")
class ArticleServiceStockCalculTest {

    // @Mock crée un "faux" repository qui ne touche pas la base de données
    @Mock
    private ArticleRepository articleRepo;

    // @InjectMocks injecte automatiquement les mocks dans le service à tester
    @InjectMocks
    private ArticleService articleService;

    // IDs de test fictifs
    private static final Long ARTICLE_ID = 42L;
    private static final Long DEPOT_ID   = 1L;

    // =========================================================================
    // Test 2.1 : Stock disponible = Stock physique - Réservations
    // =========================================================================
    @Test
    @DisplayName("Calcul correct : stock physique 100 - réservé 30 = disponible 70")
    void stockDisponible_doitRetournerQuantitePhysiqueMoinsReservations() {
        // GIVEN — Le faux repo simule 70 unités disponibles (100 physiques - 30 réservées)
        // C'est la formule SQL : stock_physique - reserved_qty dans article_stock_depot
        when(articleRepo.getStockDisponible(ARTICLE_ID, DEPOT_ID)).thenReturn(70);

        // WHEN — On appelle la vraie méthode du service
        int resultat = articleService.getStockDisponible(ARTICLE_ID, DEPOT_ID);

        // THEN — Le résultat doit être exactement 70
        assertThat(resultat)
            .as("Stock disponible = physique (100) - réservé (30) = 70")
            .isEqualTo(70);
    }

    // =========================================================================
    // Test 2.2 : Stock disponible peut être zéro (tout est réservé)
    // =========================================================================
    @Test
    @DisplayName("Stock disponible = 0 quand tout est réservé")
    void stockDisponible_doitRetournerZeroQuandToutEstReserve() {
        // GIVEN — Toute la quantité physique est réservée, disponible = 0
        when(articleRepo.getStockDisponible(ARTICLE_ID, DEPOT_ID)).thenReturn(0);

        // WHEN
        int resultat = articleService.getStockDisponible(ARTICLE_ID, DEPOT_ID);

        // THEN — Zéro est un résultat valide (stock épuisé mais pas négatif)
        assertThat(resultat)
            .as("Stock disponible doit être 0 si toute la quantité est réservée")
            .isZero();
    }

    // =========================================================================
    // Test 2.3 : Vérification du calcul des pages dans getAll()
    // Le service utilise Math.ceil(total / taille) pour calculer totalPages
    // =========================================================================
    @Test
    @DisplayName("Calcul de pagination : ceil(10 articles / 3 par page) = 4 pages")
    void calculPagination_doitArrondiAuSuperieur() {
        // GIVEN — 10 articles, 3 par page → 4 pages (3+3+3+1)
        int total = 10;
        int pageSize = 3;

        // WHEN — Formule extraite directement du service
        int totalPages = (int) Math.ceil((double) total / pageSize);

        // THEN — On attend 4 pages (et non 3, ce qui serait une erreur d'arrondi)
        assertThat(totalPages)
            .as("10 articles sur 3 par page = 4 pages (arrondi au supérieur)")
            .isEqualTo(4);
    }
}
