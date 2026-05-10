package com.maka.finance.invoicing_service.mappers;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.Paiement;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PaiementMapper {

    public Paiement toEntity(CreatePaiementRequest request, Facture facture) {
        Paiement paiement = new Paiement();
        paiement.setFacture(facture);
        paiement.setMontant(request.montant());

        // Auto-générer la référence si non fournie
        String ref = request.referenceTransaction();
        if (ref == null || ref.isBlank()) {
            ref = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        paiement.setReferenceTransaction(ref);

        // Type par défaut : CLIENT
        String type = request.type();
        paiement.setType(type != null && !type.isBlank() ? type : "CLIENT");

        return paiement;
    }

    public PaiementResponse toResponse(Paiement paiement) {
        return new PaiementResponse(
                paiement.getId(),
                paiement.getFacture().getId(),
                paiement.getMontant(),
                paiement.getModePaiement() != null ? paiement.getModePaiement().getLibelle() : "N/A",
                paiement.getCompteBancaire() != null ? paiement.getCompteBancaire().getNomBanque() : "N/A",
                paiement.getCompteBancaire() != null ? paiement.getCompteBancaire().getId() : null,
                paiement.getReferenceTransaction(),
                paiement.getType(),
                paiement.getStatut(),
                paiement.getDatePaiement(),
                paiement.getDateCreation()
        );
    }
}
