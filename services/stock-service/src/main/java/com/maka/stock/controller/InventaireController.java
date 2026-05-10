package com.maka.stock.controller;

import com.maka.stock.core.ApiResponse;
import com.maka.stock.core.JwtClaims;
import com.maka.stock.model.Inventaire;
import com.maka.stock.service.InventaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API de gestion des inventaires physiques.
 *
 * POST /api/stock/inventaires/demarrer?depotId=1  → Démarrer un inventaire
 * GET  /api/stock/inventaires                     → Lister tous les inventaires
 * GET  /api/stock/inventaires/{id}                → Détail + lignes
 * PUT  /api/stock/inventaires/lines/{lineId}      → Saisir quantité réelle
 * POST /api/stock/inventaires/{id}/valider        → Valider + créer ajustements
 */
@RestController
@RequestMapping("/api/stock/inventaires")
@RequiredArgsConstructor
public class InventaireController {

    private final InventaireService inventaireService;

    @PostMapping("/demarrer")
    public ResponseEntity<ApiResponse<Inventaire>> demarrer(
            @RequestParam Long depotId,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtClaims.userId(jwt);
        Inventaire inv = inventaireService.demarrer(depotId, userId);
        return ResponseEntity.status(201).body(ApiResponse.ok(inv, "Inventaire démarré."));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Inventaire>>> lister() {
        return ResponseEntity.ok(ApiResponse.ok(inventaireService.listerTous(), "OK"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Inventaire>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(inventaireService.getDetail(id), "OK"));
    }

    @PutMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<Void>> saisirQuantite(
            @PathVariable Long lineId,
            @RequestParam int quantiteReelle) {
        inventaireService.saisirQuantite(lineId, quantiteReelle);
        return ResponseEntity.ok(ApiResponse.ok(null, "Quantité mise à jour."));
    }

    @PostMapping("/{id}/valider")
    public ResponseEntity<ApiResponse<Inventaire>> valider(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtClaims.userId(jwt);
        Inventaire inv = inventaireService.valider(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(inv, "Inventaire validé. Ajustements appliqués."));
    }

}
