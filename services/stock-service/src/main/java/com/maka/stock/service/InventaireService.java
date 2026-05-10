package com.maka.stock.service;

import com.maka.stock.model.Inventaire;
import com.maka.stock.model.InventaireLine;
import com.maka.stock.repository.ArticleRepository;
import com.maka.stock.repository.InventaireRepository;
import com.maka.stock.repository.MouvementStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service de gestion des inventaires physiques.
 *
 * Processus :
 * 1. Démarrer un inventaire → snapshot du stock système dans les lignes
 * 2. Saisir les quantités réelles article par article
 * 3. Valider → créer automatiquement des mouvements d'ajustement pour chaque écart
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventaireService {

    private final InventaireRepository inventaireRepo;
    private final ArticleRepository articleRepo;
    private final MouvementStockRepository mvtRepo;

    /**
     * Démarre un inventaire pour un dépôt.
     * Pré-remplit les lignes avec les quantités système actuelles.
     */
    @Transactional
    public Inventaire demarrer(Long depotId, Long userId) {
        Inventaire inv = inventaireRepo.create(depotId, userId);
        List<InventaireLine> lines = inventaireRepo.findLines(inv.getId());
        inv.setLines(lines);
        log.info("[INVENTAIRE] Démarré id={} depot={} avec {} articles", inv.getId(), depotId, lines.size());
        return inv;
    }

    /**
     * Retourne le détail d'un inventaire avec toutes ses lignes.
     */
    public Inventaire getDetail(Long inventaireId) {
        Inventaire inv = inventaireRepo.findById(inventaireId)
                .orElseThrow(() -> new IllegalArgumentException("Inventaire " + inventaireId + " introuvable"));
        inv.setLines(inventaireRepo.findLines(inventaireId));
        return inv;
    }

    /**
     * Saisit la quantité réelle pour une ligne d'inventaire.
     * L'écart est recalculé automatiquement par PostgreSQL (GENERATED ALWAYS AS).
     */
    @Transactional
    public void saisirQuantite(Long lineId, int quantiteReelle) {
        if (quantiteReelle < 0) {
            throw new IllegalArgumentException("La quantité réelle ne peut pas être négative.");
        }
        inventaireRepo.updateQuantiteReelle(lineId, quantiteReelle);
    }

    /**
     * Valide un inventaire et crée des mouvements d'ajustement pour chaque écart.
     *
     * Pour chaque ligne où ecart != 0 :
     *   - ecart > 0 (surplus physique)  → créer ENTREE avec source_type='INVENTAIRE'
     *   - ecart < 0 (manque physique)   → créer SORTIE avec source_type='INVENTAIRE'
     *
     * L'inventaire passe au statut VALIDE (immuable après validation).
     */
    @Transactional
    public Inventaire valider(Long inventaireId, Long userId) {
        Inventaire inv = inventaireRepo.findById(inventaireId)
                .orElseThrow(() -> new IllegalArgumentException("Inventaire introuvable."));

        if (!"EN_COURS".equals(inv.getStatut())) {
            throw new IllegalStateException("Inventaire déjà " + inv.getStatut() + ". Impossible de valider.");
        }

        List<InventaireLine> lignesAvecEcart = inventaireRepo.findLinesWithEcart(inventaireId);

        int ajustements = 0;
        for (InventaireLine line : lignesAvecEcart) {
            int ecart = line.getEcart(); // Calculé par DB

            // Créer un mouvement d'ajustement de stock selon le sens de l'écart
            String typeMvt = ecart > 0 ? "ENTREE" : "SORTIE";
            int delta = Math.abs(ecart);

            // Créer le mouvement header
            Long mvtId = mvtRepo.createAjustement(typeMvt, inv.getDepotId(), userId,
                    inventaireId, delta, line.getArticleId());

            // Mettre à jour le stock physique dans article_stock_depot
            articleRepo.updateStockDepot(line.getArticleId(), inv.getDepotId(), ecart);

            log.info("[INVENTAIRE] Ajustement article={} ecart={} mouvement={}", line.getArticleId(), ecart, mvtId);
            ajustements++;
        }

        inventaireRepo.updateStatut(inventaireId, "VALIDE");
        log.info("[INVENTAIRE] Validé id={} avec {} ajustements", inventaireId, ajustements);

        return getDetail(inventaireId);
    }

    public List<Inventaire> listerTous() {
        return inventaireRepo.findAll();
    }
}
