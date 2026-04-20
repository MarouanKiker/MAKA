package com.maka.finance.invoicing_service.dto;

import com.maka.finance.invoicing_service.entities.StatutFacture;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Schema(description = "Représentation d'une facture")
public record FactureResponse(
        Long id,
        String numero,
        BigDecimal tauxTVA,
        BigDecimal montantHT,
        BigDecimal montantTVA,
        BigDecimal montantTTC,
        BigDecimal montantPaye,
        BigDecimal resteAPayer,
        StatutFacture statut,
        OffsetDateTime dateCreation,
        OffsetDateTime dateMiseAJour,
        List<LigneFactureResponse> lignes
) {
}
