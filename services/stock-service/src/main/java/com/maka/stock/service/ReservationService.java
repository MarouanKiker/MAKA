package com.maka.stock.service;

import com.maka.stock.model.ReservationStock;
import com.maka.stock.repository.ArticleRepository;
import com.maka.stock.repository.ReservationStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service de réservation de stock.
 *
 * Principe : avant de valider une commande (ex: une vente dans le CRM),
 * le système réserve la quantité nécessaire. Cela empêche la survente.
 *
 * Flux : Réservation (ACTIVE) → Validation → Mouvement SORTIE + statut CONSUMED
 *                              → Annulation   → statut RELEASED (stock libéré)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationStockRepository reservationRepo;
    private final ArticleRepository articleRepo;

    /**
     * Réserve du stock pour une commande.
     * Idempotent : si une réservation ACTIVE existe déjà pour cette commande + article, on la retourne.
     */
    @Transactional
    public ReservationStock reserver(Long articleId, Long depotId, int quantite,
                                    String sourceType, Long sourceId) {
        // --- Idempotency check : évite les doublons si l'événement est rejoué ---
        var existing = reservationRepo.findBySource(sourceType, sourceId, articleId);
        if (existing.isPresent()) {
            log.info("[RESERVATION] Réservation déjà existante pour source={}:{} article={}",
                    sourceType, sourceId, articleId);
            return existing.get();
        }

        // --- Vérification du stock disponible (physique - déjà réservé) ---
        int dispo = articleRepo.getStockDisponible(articleId, depotId);
        if (dispo < quantite) {
            throw new IllegalStateException(
                    String.format("Stock insuffisant pour article=%d depot=%d. Disponible: %d, Demandé: %d",
                            articleId, depotId, dispo, quantite));
        }

        // --- Créer la réservation ---
        ReservationStock reservation = ReservationStock.builder()
                .articleId(articleId)
                .depotId(depotId)
                .quantite(quantite)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .build();

        ReservationStock saved = reservationRepo.save(reservation);
        log.info("[RESERVATION] Réservation créée id={} article={} depot={} qte={}",
                saved.getId(), articleId, depotId, quantite);
        return saved;
    }

    /**
     * Consomme une réservation (après la livraison physique).
     * Passe le statut à CONSUMED. Le mouvement SORTIE réel doit être créé séparément.
     */
    @Transactional
    public void consommer(Long reservationId) {
        var r = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation " + reservationId + " introuvable"));

        if (!"ACTIVE".equals(r.getStatut())) {
            throw new IllegalStateException("Impossible de consommer une réservation au statut : " + r.getStatut());
        }

        reservationRepo.updateStatut(reservationId, "CONSUMED");
        log.info("[RESERVATION] Réservation {} CONSUMED", reservationId);
    }

    /**
     * Libère une réservation (annulation commande).
     * Le stock redevient disponible pour d'autres commandes.
     */
    @Transactional
    public int libererParSource(String sourceType, Long sourceId) {
        int count = reservationRepo.releaseBySource(sourceType, sourceId);
        log.info("[RESERVATION] {} réservation(s) RELEASED pour source={}:{}", count, sourceType, sourceId);
        return count;
    }
}
