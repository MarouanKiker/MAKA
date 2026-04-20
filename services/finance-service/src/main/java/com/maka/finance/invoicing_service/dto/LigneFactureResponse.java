package com.maka.finance.invoicing_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Ligne de facture")
public record LigneFactureResponse(
        Long id,
        String produit,
        Integer quantite,
        BigDecimal prixUnitaire,
        BigDecimal totalLigne
) {
}
