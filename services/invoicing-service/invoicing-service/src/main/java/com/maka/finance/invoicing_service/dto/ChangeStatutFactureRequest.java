package com.maka.finance.invoicing_service.dto;

import com.maka.finance.invoicing_service.entities.StatutFacture;
import jakarta.validation.constraints.NotNull;

public record ChangeStatutFactureRequest(
        @NotNull(message = "Le statut est obligatoire")
        StatutFacture statut
) {
}
