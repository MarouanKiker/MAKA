package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.services.PaiementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/paiements")
@Tag(name = "Paiements", description = "API de gestion des paiements")
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    @GetMapping
    @Operation(summary = "Lister tous les paiements")
    @PreAuthorize("isAuthenticated()")
    public List<PaiementResponse> getAll() {
        return paiementService.getAll();
    }

    @PostMapping
    @Operation(summary = "Créer un paiement")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaiementResponse> create(@Valid @RequestBody CreatePaiementRequest request) {
        return ResponseEntity.ok(paiementService.create(request));
    }

    @PatchMapping("/{id}/valider")
    @Operation(summary = "Valider un paiement en attente")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaiementResponse> valider(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.validatePayment(id));
    }

    @PatchMapping("/{id}/rejeter")
    @Operation(summary = "Rejeter un paiement en attente")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaiementResponse> rejeter(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.rejectPayment(id));
    }
}
