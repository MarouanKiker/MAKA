package com.maka.finance.invoicing_service.services;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.JournalTransaction;
import com.maka.finance.invoicing_service.entities.Paiement;
import com.maka.finance.invoicing_service.repositories.JournalTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ComptabiliteServiceTest {

    @Mock
    private JournalTransactionRepository journalTransactionRepository;

    private ComptabiliteService comptabiliteService;

    @BeforeEach
    void setUp() {
        comptabiliteService = new ComptabiliteService(journalTransactionRepository);
    }

    @Test
    void enregistrerEmissionFacture_shouldCreateTwoEntries_whenTvaPositive() {
        Facture facture = new Facture();
        facture.setId(1L);
        facture.setNumero("FAC-001");
        facture.setMontantHT(new BigDecimal("100.00"));
        facture.setMontantTVA(new BigDecimal("20.00"));

        when(journalTransactionRepository.findByReferenceTypeAndReferenceIdOrderByDateEcritureDesc("FACTURE", 1L))
                .thenReturn(List.of());

        comptabiliteService.enregistrerEmissionFacture(facture);

        verify(journalTransactionRepository, times(2)).save(any(JournalTransaction.class));
    }

    @Test
    void enregistrerEmissionFacture_shouldSkip_whenAlreadyExists() {
        Facture facture = new Facture();
        facture.setId(2L);

        when(journalTransactionRepository.findByReferenceTypeAndReferenceIdOrderByDateEcritureDesc("FACTURE", 2L))
                .thenReturn(List.of(new JournalTransaction()));

        comptabiliteService.enregistrerEmissionFacture(facture);

        verify(journalTransactionRepository, never()).save(any());
    }

    @Test
    void enregistrerReceptionPaiement_shouldCreateOneEntry() {
        Facture facture = new Facture();
        facture.setId(3L);

        Paiement paiement = new Paiement();
        paiement.setId(10L);
        paiement.setFacture(facture);
        paiement.setMontant(new BigDecimal("90.00"));
        paiement.setReferenceTransaction("TX-10");

        comptabiliteService.enregistrerReceptionPaiement(paiement);

        verify(journalTransactionRepository, times(1)).save(any(JournalTransaction.class));
    }
}
