package com.maka.finance.invoicing_service.mappers;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.Paiement;
import org.springframework.stereotype.Component;

@Component
public class PaiementMapper {

    public Paiement toEntity(CreatePaiementRequest request, Facture facture) {
        Paiement paiement = new Paiement();
        paiement.setFacture(facture);
        paiement.setMontant(request.montant());
        paiement.setModePaiement(request.modePaiement());
        paiement.setReferenceTransaction(request.referenceTransaction());
        return paiement;
    }

    public PaiementResponse toResponse(Paiement paiement) {
        return new PaiementResponse(
                paiement.getId(),
                paiement.getFacture().getId(),
                paiement.getMontant(),
                paiement.getModePaiement(),
                paiement.getReferenceTransaction(),
                paiement.getStatut(),
                paiement.getDatePaiement(),
                paiement.getDateCreation()
        );
    }
}
