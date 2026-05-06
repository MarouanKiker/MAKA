package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.entities.ModePaiement;
import com.maka.finance.invoicing_service.repositories.ModePaiementRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/modes-paiement")
@Tag(name = "Modes de Paiement", description = "API des modes de paiement disponibles")
public class ModePaiementController {

    private final ModePaiementRepository repository;

    public ModePaiementController(ModePaiementRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Operation(summary = "Lister tous les modes de paiement")
    public List<ModePaiement> getAll() {
        return repository.findAll();
    }

    @jakarta.annotation.PostConstruct
    public void initDefaultModes() {
        if (repository.count() == 0) {
            repository.saveAll(List.of(
                new ModePaiement("Virement"),
                new ModePaiement("Chèque"),
                new ModePaiement("Espèces"),
                new ModePaiement("Carte Bancaire")
            ));
        }
    }
}
