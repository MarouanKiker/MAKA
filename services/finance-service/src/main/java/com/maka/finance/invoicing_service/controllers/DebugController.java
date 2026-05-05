package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.repositories.FactureRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/debug")
public class DebugController {

    private final FactureRepository repository;

    public DebugController(FactureRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        try {
            long count = repository.count();
            return Map.of(
                "status", "UP",
                "database", "CONNECTED",
                "factures_count", count,
                "message", "Le service Finance est opérationnel et communique avec la base."
            );
        } catch (Exception e) {
            return Map.of(
                "status", "ERROR",
                "database", "DISCONNECTED",
                "error", e.getMessage()
            );
        }
    }
}
