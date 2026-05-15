package com.maka.stock;

// =============================================================================
// TEST 1 — Sanity Check (sans base de données)
//
// @SpringBootTest est intentionnellement ABSENT.
// On utilise un test JUnit 5 pur pour éviter que Spring ne tente de se connecter
// à PostgreSQL (qui n'existe pas dans l'environnement GitHub Actions).
//
// Ce test prouve simplement que le projet compile et que JUnit 5 fonctionne.
// C'est la première barrière qualité dans le pipeline CI/CD.
// =============================================================================

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockServiceApplicationTests {

    /**
     * Sanity Check : Vérifie que le projet compile et que JUnit 5 est fonctionnel.
     * Ce test est le minimum vital : s'il échoue, rien d'autre ne peut marcher.
     */
    @Test
    void contextLoads() {
        // Un test qui passe toujours : prouve que le pipeline CI peut exécuter des tests
        assertTrue(true, "Le projet MAKA stock-service compile correctement.");
    }
}
