package com.maka.stock.service;

import com.maka.stock.dto.CreateDepotDto;
import com.maka.stock.model.Depot;
import com.maka.stock.repository.DepotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepotService {

    private final DepotRepository depotRepo;

    public List<Depot> getAll() {
        return depotRepo.findAll();
    }

    public Depot getById(Long id) {
        return depotRepo.findById(id)
                .orElseThrow(() -> new EmptyResultDataAccessException("Dépôt " + id + " introuvable", 1));
    }

    @Transactional
    public Depot create(CreateDepotDto dto) {
        Depot depot = Depot.builder()
                .nom(dto.getNom())
                .adresse(dto.getAdresse())
                .capaciteMax(dto.getCapaciteMax())
                .build();
        return depotRepo.save(depot);
    }

    @Transactional
    public Depot update(Long id, CreateDepotDto dto) {
        getById(id);
        Depot depot = Depot.builder()
                .nom(dto.getNom())
                .adresse(dto.getAdresse())
                .capaciteMax(dto.getCapaciteMax())
                .build();
        return depotRepo.update(id, depot)
                .orElseThrow(() -> new EmptyResultDataAccessException("Dépôt " + id + " introuvable", 1));
    }

    /**
     * Suppression sécurisée d'un dépôt.
     * Vérifie si le dépôt est référencé dans des mouvements ou inventaires.
     */
    @Transactional
    public void delete(Long id) {
        getById(id);

        int nbMouvements = depotRepo.countMouvementsForDepot(id);
        if (nbMouvements > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer le dépôt : il est référencé dans " + nbMouvements
                    + " mouvement(s). Créez d'abord des mouvements de transfert pour vider le stock."
            );
        }

        int nbInventaires = depotRepo.countInventairesForDepot(id);
        if (nbInventaires > 0) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer le dépôt : il a " + nbInventaires + " inventaire(s) associé(s)."
            );
        }

        // Nettoyer le stock par dépôt (aucune FK sur article_stock_depot vers depot sans cascade)
        depotRepo.deleteStockDepot(id);
        depotRepo.deleteReservations(id);

        if (!depotRepo.delete(id)) {
            throw new EmptyResultDataAccessException("Dépôt " + id + " introuvable", 1);
        }
    }
}
