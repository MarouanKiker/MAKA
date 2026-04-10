package com.maka.finance.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

// =============================================================================
// Tests Unitaires — Entité Paiement
// Vérifie que l'entité Paiement se construit et se manipule correctement
// =============================================================================
class PaiementTest {

    @Test
    @DisplayName("Un paiement doit stocker et restituer ses données correctement")
    void paiement_getters_setters() {
        // GIVEN
        Paiement paiement = new Paiement();

        // WHEN
        paiement.setMontant(500.0);
        paiement.setType("CLIENT");
        paiement.setDate(LocalDate.of(2026, 3, 15));
        paiement.setFactureId(10L);
        paiement.setUtilisateurId(3L);

        // THEN
        assertEquals(500.0, paiement.getMontant());
        assertEquals("CLIENT", paiement.getType());
        assertEquals(LocalDate.of(2026, 3, 15), paiement.getDate());
        assertEquals(10L, paiement.getFactureId());
        assertEquals(3L, paiement.getUtilisateurId());
    }

    @Test
    @DisplayName("Un paiement sans données doit avoir des valeurs null")
    void paiement_vide_doit_etre_null() {
        Paiement paiement = new Paiement();

        assertNull(paiement.getId());
        assertNull(paiement.getMontant());
        assertNull(paiement.getType());
        assertNull(paiement.getDate());
    }

    @Test
    @DisplayName("Le type doit accepter CLIENT et FOURNISSEUR")
    void paiement_types_valides() {
        Paiement p1 = new Paiement();
        p1.setType("CLIENT");
        assertEquals("CLIENT", p1.getType());

        Paiement p2 = new Paiement();
        p2.setType("FOURNISSEUR");
        assertEquals("FOURNISSEUR", p2.getType());
    }
}
