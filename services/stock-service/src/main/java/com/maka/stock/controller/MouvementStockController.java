package com.maka.stock.controller;

import com.maka.stock.core.ApiResponse;
import com.maka.stock.dto.CreateMouvementDto;
import com.maka.stock.service.MouvementStockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock/mouvements")
@RequiredArgsConstructor
public class MouvementStockController {

    private final MouvementStockService mvtService;

    /** GET /api/stock/mouvements?page=1&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(mvtService.getAll(page, size)));
    }

    /** GET /api/stock/mouvements/{id}/lignes */
    @GetMapping("/{id}/lignes")
    public ResponseEntity<ApiResponse<?>> getLignes(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(mvtService.getLignes(id)));
    }

    /** GET /api/stock/mouvements/article/{articleId} */
    @GetMapping("/article/{articleId}")
    public ResponseEntity<ApiResponse<?>> getHistorique(
            @PathVariable Long articleId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(mvtService.getHistorique(articleId, page, size)));
    }

    /**
     * POST /api/stock/mouvements
     * Crée et valide immédiatement un mouvement (1 article).
     * Les IDs de dépôt vides ("") sont ignorés et remplacés par null.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @Valid @RequestBody CreateMouvementDto dto,
            @AuthenticationPrincipal Jwt currentUser) {
        // Nettoyage défensif : convertir les chaînes vides en null
        if (dto.getDepotSourceId() != null && dto.getDepotSourceId() == 0) {
            dto.setDepotSourceId(null);
        }
        if (dto.getDepotDestinationId() != null && dto.getDepotDestinationId() == 0) {
            dto.setDepotDestinationId(null);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        mvtService.enregistrerMouvement(dto, currentUser),
                        "Mouvement enregistré et stock mis à jour"));
    }

    /** POST /api/stock/mouvements/{id}/valider — Passer BROUILLON → VALIDE */
    @PostMapping("/{id}/valider")
    public ResponseEntity<ApiResponse<?>> valider(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(mvtService.valider(id), "Mouvement validé."));
    }

    /** DELETE /api/stock/mouvements/{id} — Annuler un mouvement BROUILLON */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> annuler(@PathVariable Long id) {
        mvtService.annuler(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Mouvement annulé."));
    }
}
