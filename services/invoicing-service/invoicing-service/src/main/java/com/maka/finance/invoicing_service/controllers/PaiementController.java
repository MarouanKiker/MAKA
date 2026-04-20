package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.services.PaiementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/paiements")
@Tag(name = "Paiements", description = "API de gestion des paiements")
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    @PostMapping
    @Operation(summary = "Enregistrer un paiement")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<PaiementResponse> create(@Valid @RequestBody CreatePaiementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paiementService.create(request));
    }

    @PatchMapping("/{id}/valider")
    @Operation(summary = "Valider un paiement")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<PaiementResponse> validate(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.validatePayment(id));
    }

    @PatchMapping("/{id}/rejeter")
    @Operation(summary = "Rejeter un paiement")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<PaiementResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.rejectPayment(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulter un paiement")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<PaiementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paiementService.getById(id));
    }

    @GetMapping
    @Operation(summary = "Lister tous les paiements")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<List<PaiementResponse>> getAll() {
        return ResponseEntity.ok(paiementService.getAll());
    }

    @GetMapping("/facture/{factureId}")
    @Operation(summary = "Lister les paiements d'une facture")
    @PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
    public ResponseEntity<List<PaiementResponse>> getByFacture(@PathVariable Long factureId) {
        return ResponseEntity.ok(paiementService.getByFactureId(factureId));
    }
}
