package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.dto.JournalTransactionResponse;
import com.maka.finance.invoicing_service.services.ComptabiliteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/journal")
@Tag(name = "Comptabilite", description = "API journal comptable")
public class ComptabiliteController {

    private final ComptabiliteService comptabiliteService;

    public ComptabiliteController(ComptabiliteService comptabiliteService) {
        this.comptabiliteService = comptabiliteService;
    }

    @GetMapping
    @Operation(summary = "Lister toutes les ecritures comptables")
    @PreAuthorize("hasAnyRole('COMPTABLE','GESTIONNAIRE','ADMIN')")
    public ResponseEntity<List<JournalTransactionResponse>> getJournal() {
        return ResponseEntity.ok(comptabiliteService.getJournal());
    }

    @GetMapping("/compte/{compte}")
    @Operation(summary = "Lister les ecritures par compte")
    @PreAuthorize("hasAnyRole('COMPTABLE','GESTIONNAIRE','ADMIN')")
    public ResponseEntity<List<JournalTransactionResponse>> getByCompte(@PathVariable String compte) {
        return ResponseEntity.ok(comptabiliteService.getJournalByCompte(compte));
    }
}
