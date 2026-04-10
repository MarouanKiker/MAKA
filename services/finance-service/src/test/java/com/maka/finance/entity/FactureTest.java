package com.maka.finance.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// =============================================================================
// Tests Unitaires — Entité Facture
// Vérifie que la logique métier (calcul TVA/TTC) fonctionne correctement
// =============================================================================
class FactureTest {

    @Test
    @DisplayName("calculerTTC doit calculer la taxe et le montant TTC correctement")
    void calculerTTC_devrait_calculer_correctement() {
        // GIVEN : une facture de 1000€ avec 20% de TVA
        Facture facture = new Facture();
        facture.setMontant(1000.0);
        facture.setTauxTVA(20.0);

        // WHEN : on calcule le TTC
        facture.calculerTTC();

        // THEN : taxe = 200€, TTC = 1200€
        assertEquals(200.0, facture.getTaxe(), "La taxe doit être 20% de 1000 = 200");
        assertEquals(1200.0, facture.getMontantTTC(), "Le TTC doit être 1000 + 200 = 1200");
    }

    @Test
    @DisplayName("calculerTTC avec TVA à 0% doit donner TTC = montant HT")
    void calculerTTC_tva_zero() {
        // GIVEN : facture sans TVA
        Facture facture = new Facture();
        facture.setMontant(500.0);
        facture.setTauxTVA(0.0);

        // WHEN
        facture.calculerTTC();

        // THEN
        assertEquals(0.0, facture.getTaxe(), "La taxe doit être 0");
        assertEquals(500.0, facture.getMontantTTC(), "Le TTC doit être égal au HT si TVA = 0");
    }

    @Test
    @DisplayName("calculerTTC ne doit rien faire si le montant est null")
    void calculerTTC_montant_null_ne_crash_pas() {
        // GIVEN : facture sans montant
        Facture facture = new Facture();
        facture.setTauxTVA(20.0);
        // montant reste null

        // WHEN
        facture.calculerTTC();

        // THEN : rien ne doit avoir changé (pas de crash)
        assertNull(facture.getTaxe(), "La taxe doit rester null");
        assertNull(facture.getMontantTTC(), "Le TTC doit rester null");
    }

    @Test
    @DisplayName("Les getters et setters doivent fonctionner correctement")
    void getters_setters_fonctionnent() {
        Facture facture = new Facture();

        facture.setNumero("FAC-001");
        facture.setMontant(750.0);
        facture.setStatut("IMPAYEE");
        facture.setUtilisateurId(5L);

        assertEquals("FAC-001", facture.getNumero());
        assertEquals(750.0, facture.getMontant());
        assertEquals("IMPAYEE", facture.getStatut());
        assertEquals(5L, facture.getUtilisateurId());
    }

    @Test
    @DisplayName("Test de non-régression : le calcul TTC avec des décimales")
    void calculerTTC_decimales_precision() {
        // GIVEN : montant avec des centimes
        Facture facture = new Facture();
        facture.setMontant(199.99);
        facture.setTauxTVA(5.5);

        // WHEN
        facture.calculerTTC();

        // THEN : vérification avec une tolérance de 0.01
        assertEquals(10.99, facture.getTaxe(), 0.01, "Taxe 5.5% de 199.99");
        assertEquals(210.98, facture.getMontantTTC(), 0.01, "TTC = HT + Taxe");
    }
}
