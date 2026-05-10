package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Session de comptage physique (Inventaire).
 * Un inventaire est rattaché à un seul dépôt.
 * Statuts : EN_COURS → VALIDE (crée automatiquement des mouvements d'ajustement) | ANNULE
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inventaire {
    private Long id;
    private Long depotId;
    private String statut;   // EN_COURS | VALIDE | ANNULE
    private LocalDateTime dateInv;
    private Long createdBy;

    // Lignes de détail (non persistées dans cette classe, chargées séparément)
    private List<InventaireLine> lines;
}
