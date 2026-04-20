package com.maka.finance.invoicing_service.controllers;

import com.maka.finance.invoicing_service.dto.ChangeStatutFactureRequest;
import com.maka.finance.invoicing_service.dto.FactureRequest;
import com.maka.finance.invoicing_service.dto.FactureResponse;
import com.maka.finance.invoicing_service.dto.PaiementRequest;
import com.maka.finance.invoicing_service.services.FactureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/factures")
@Tag(name = "Factures", description = "API de gestion des factures")
public class FactureController {

	private final FactureService factureService;

	public FactureController(FactureService factureService) {
		this.factureService = factureService;
	}

	@PostMapping
	@Operation(summary = "Créer une facture")
	@PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
	public ResponseEntity<FactureResponse> create(@Valid @RequestBody FactureRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(factureService.create(request));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Obtenir une facture par id")
	@PreAuthorize("hasAnyRole('COMPTABLE','GESTIONNAIRE','ADMIN')")
	public ResponseEntity<FactureResponse> getById(@PathVariable Long id) {
		return ResponseEntity.ok(factureService.getById(id));
	}

	@GetMapping
	@Operation(summary = "Lister toutes les factures")
	@PreAuthorize("hasAnyRole('COMPTABLE','GESTIONNAIRE','ADMIN')")
	public ResponseEntity<List<FactureResponse>> getAll() {
		return ResponseEntity.ok(factureService.getAll());
	}

	@PutMapping("/{id}")
	@Operation(summary = "Mettre à jour une facture")
	@PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
	public ResponseEntity<FactureResponse> update(@PathVariable Long id, @Valid @RequestBody FactureRequest request) {
		return ResponseEntity.ok(factureService.update(id, request));
	}

	@PatchMapping("/{id}/statut")
	@Operation(summary = "Changer le statut d'une facture")
	@PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
	public ResponseEntity<FactureResponse> changeStatus(
			@PathVariable Long id,
			@Valid @RequestBody ChangeStatutFactureRequest request
	) {
		return ResponseEntity.ok(factureService.changeStatus(id, request.statut()));
	}

	@DeleteMapping("/{id}")
	@Operation(summary = "Supprimer une facture")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		factureService.delete(id);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{id}/paiements")
	@Operation(summary = "Appliquer un paiement à une facture")
	@PreAuthorize("hasAnyRole('COMPTABLE','ADMIN')")
	public ResponseEntity<FactureResponse> appliquerPaiement(
			@PathVariable Long id,
			@Valid @RequestBody PaiementRequest request
	) {
		return ResponseEntity.ok(factureService.appliquerPaiement(id, request));
	}
}

