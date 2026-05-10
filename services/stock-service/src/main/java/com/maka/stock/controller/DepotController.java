package com.maka.stock.controller;

import com.maka.stock.core.ApiResponse;
import com.maka.stock.dto.CreateDepotDto;
import com.maka.stock.service.DepotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock/depots")
@RequiredArgsConstructor
public class DepotController {

    private final DepotService depotService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(depotService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(depotService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreateDepotDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(depotService.create(dto), "Dépôt créé avec succès"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateDepotDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(depotService.update(id, dto), "Dépôt mis à jour"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        depotService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Dépôt supprimé avec succès"));
    }
}
