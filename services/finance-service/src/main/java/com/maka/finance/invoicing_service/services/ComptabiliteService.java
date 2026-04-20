package com.maka.finance.invoicing_service.services;

import com.maka.finance.invoicing_service.dto.JournalTransactionResponse;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.JournalTransaction;
import com.maka.finance.invoicing_service.entities.Paiement;
import com.maka.finance.invoicing_service.repositories.JournalTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ComptabiliteService {

    private static final String COMPTE_CLIENT = "411000";
    private static final String COMPTE_BANQUE = "512000";
    private static final String COMPTE_VENTES = "701000";
    private static final String COMPTE_TVA = "445710";

    private final JournalTransactionRepository journalTransactionRepository;

    public ComptabiliteService(JournalTransactionRepository journalTransactionRepository) {
        this.journalTransactionRepository = journalTransactionRepository;
    }

    public void enregistrerEmissionFacture(Facture facture) {
        if (!journalTransactionRepository.findByReferenceTypeAndReferenceIdOrderByDateEcritureDesc("FACTURE", facture.getId()).isEmpty()) {
            return;
        }

        saveEcriture(
                COMPTE_CLIENT,
                COMPTE_VENTES,
                facture.getMontantHT(),
                "FACTURE",
                facture.getId(),
                "Emission facture " + facture.getNumero() + " - HT"
        );

        if (facture.getMontantTVA().compareTo(BigDecimal.ZERO) > 0) {
            saveEcriture(
                    COMPTE_CLIENT,
                    COMPTE_TVA,
                    facture.getMontantTVA(),
                    "FACTURE",
                    facture.getId(),
                    "Emission facture " + facture.getNumero() + " - TVA"
            );
        }
    }

    public void enregistrerReceptionPaiement(Paiement paiement) {
        saveEcriture(
                COMPTE_BANQUE,
                COMPTE_CLIENT,
                paiement.getMontant(),
                "PAIEMENT",
                paiement.getId(),
                "Reception paiement ref " + paiement.getReferenceTransaction()
        );
    }

    @Transactional(readOnly = true)
    public List<JournalTransactionResponse> getJournal() {
        return journalTransactionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<JournalTransactionResponse> getJournalByCompte(String compte) {
        return journalTransactionRepository.findByCompteDebitOrCompteCreditOrderByDateEcritureDesc(compte, compte)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void saveEcriture(
            String compteDebit,
            String compteCredit,
            BigDecimal montant,
            String referenceType,
            Long referenceId,
            String description
    ) {
        JournalTransaction entry = new JournalTransaction();
        entry.setCompteDebit(compteDebit);
        entry.setCompteCredit(compteCredit);
        entry.setDebit(montant);
        entry.setCredit(montant);
        entry.setReferenceType(referenceType);
        entry.setReferenceId(referenceId);
        entry.setDescription(description);
        journalTransactionRepository.save(entry);
    }

    private JournalTransactionResponse toResponse(JournalTransaction entity) {
        return new JournalTransactionResponse(
                entity.getId(),
                entity.getDateEcriture(),
                entity.getCompteDebit(),
                entity.getCompteCredit(),
                entity.getDebit(),
                entity.getCredit(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.getDescription()
        );
    }
}
