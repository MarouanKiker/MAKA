package com.maka.stock.controller;

import com.maka.stock.core.ApiResponse;
import com.maka.stock.dto.CreateReservationDto;
import com.maka.stock.model.ReservationStock;
import com.maka.stock.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * API de gestion des réservations de stock.
 *
 * POST /api/stock/reservations          → Créer une réservation
 * POST /api/stock/reservations/{id}/consommer  → Consommer (après livraison)
 * POST /api/stock/reservations/liberer         → Libérer (après annulation commande)
 */
@RestController
@RequestMapping("/api/stock/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationStock>> reserver(
            @Valid @RequestBody CreateReservationDto dto) {
        ReservationStock r = reservationService.reserver(
                dto.getArticleId(), dto.getDepotId(), dto.getQuantite(),
                dto.getSourceType(), dto.getSourceId());
        return ResponseEntity.status(201).body(ApiResponse.ok(r, "Réservation créée."));
    }

    @PostMapping("/{id}/consommer")
    public ResponseEntity<ApiResponse<Void>> consommer(@PathVariable Long id) {
        reservationService.consommer(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Réservation consommée."));
    }

    @PostMapping("/liberer")
    public ResponseEntity<ApiResponse<Void>> liberer(
            @RequestParam String sourceType,
            @RequestParam Long sourceId) {
        int count = reservationService.libererParSource(sourceType, sourceId);
        return ResponseEntity.ok(ApiResponse.ok(null, count + " réservation(s) libérée(s)."));
    }
}
