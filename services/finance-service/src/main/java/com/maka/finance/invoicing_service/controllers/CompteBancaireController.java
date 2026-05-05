package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.entities.CompteBancaire;
import com.maka.finance.invoicing_service.repositories.CompteBancaireRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/comptes-bancaires")
@Tag(name = "Comptes Bancaires", description = "API de gestion des comptes bancaires")
public class CompteBancaireController {

    private final CompteBancaireRepository repository;

    public CompteBancaireController(CompteBancaireRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Operation(summary = "Lister tous les comptes bancaires")
    @PreAuthorize("isAuthenticated()")
    public List<CompteBancaire> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @Operation(summary = "Créer un compte bancaire")
    @PreAuthorize("isAuthenticated()")
    public CompteBancaire create(@RequestBody CompteBancaire compte) {
        return repository.save(compte);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un compte bancaire")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
