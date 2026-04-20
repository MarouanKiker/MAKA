package com.maka.finance.invoicing_service.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.dto.event.PaymentEvent;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.LigneFacture;
import com.maka.finance.invoicing_service.entities.ModePaiement;
import com.maka.finance.invoicing_service.entities.Paiement;
import com.maka.finance.invoicing_service.entities.StatutFacture;
import com.maka.finance.invoicing_service.entities.StatutPaiement;
import com.maka.finance.invoicing_service.events.FinanceEventPublisher;
import com.maka.finance.invoicing_service.exceptions.BusinessException;
import com.maka.finance.invoicing_service.mappers.PaiementMapper;
import com.maka.finance.invoicing_service.metrics.FinanceMetrics;
import com.maka.finance.invoicing_service.repositories.FactureRepository;
import com.maka.finance.invoicing_service.repositories.PaiementRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepository;
    @Mock
    private FactureRepository factureRepository;
    @Mock
    private PaiementMapper paiementMapper;
    @Mock
    private ComptabiliteService comptabiliteService;
    @Mock
    private FinanceEventPublisher financeEventPublisher;
    @Mock
    private FinanceMetrics financeMetrics;

    private PaiementService paiementService;

    @BeforeEach
    void setUp() {
        paiementService = new PaiementService(
                paiementRepository,
                factureRepository,
                paiementMapper,
                comptabiliteService,
                financeEventPublisher,
                financeMetrics
        );
    }

    @Test
    void create_shouldThrow_whenFactureStatusInvalid() {
        Facture facture = new Facture();
        facture.setId(1L);
        facture.setStatut(StatutFacture.BROUILLON);
        facture.setResteAPayer(new BigDecimal("100.00"));

        CreatePaiementRequest request = new CreatePaiementRequest(1L, new BigDecimal("50.00"), ModePaiement.VIREMENT, "TX-1");

        when(paiementRepository.existsByReferenceTransaction("TX-1")).thenReturn(false);
        when(factureRepository.findById(1L)).thenReturn(Optional.of(facture));

        assertThrows(BusinessException.class, () -> paiementService.create(request));

        verify(paiementRepository, never()).save(any());
    }

    @Test
    void create_shouldSavePublishAndRecordMetrics() {
        Facture facture = new Facture();
        facture.setId(2L);
        facture.setStatut(StatutFacture.ENVOYEE);
        facture.setResteAPayer(new BigDecimal("200.00"));

        CreatePaiementRequest request = new CreatePaiementRequest(2L, new BigDecimal("80.00"), ModePaiement.CARTE_BANCAIRE, "TX-2");

        Paiement paiement = new Paiement();
        paiement.setFacture(facture);
        paiement.setMontant(new BigDecimal("80.00"));
        paiement.setReferenceTransaction("TX-2");
        paiement.setStatut(StatutPaiement.EN_ATTENTE);

        PaiementResponse response = new PaiementResponse(
                5L, 2L, new BigDecimal("80.00"), ModePaiement.CARTE_BANCAIRE,
                "TX-2", StatutPaiement.EN_ATTENTE, null, null
        );

        when(paiementRepository.existsByReferenceTransaction("TX-2")).thenReturn(false);
        when(factureRepository.findById(2L)).thenReturn(Optional.of(facture));
        when(paiementMapper.toEntity(request, facture)).thenReturn(paiement);
        when(paiementRepository.save(paiement)).thenReturn(paiement);
        when(paiementMapper.toResponse(paiement)).thenReturn(response);

        paiementService.create(request);

        verify(financeEventPublisher).publishPaymentReceived(any(PaymentEvent.class));
        verify(financeMetrics).incrementPaymentsReceived();
        verify(financeMetrics).recordPaymentAmount(80.00d);
    }

    @Test
    void validatePayment_shouldApplyPaymentAndPublish() {
        Facture facture = new Facture();
        facture.setId(3L);
        facture.setNumero("FAC-003");
        facture.setStatut(StatutFacture.ENVOYEE);
        facture.setTauxTVA(BigDecimal.ZERO);

        LigneFacture ligne = new LigneFacture();
        ligne.setProduit("Service");
        ligne.setQuantite(1);
        ligne.setPrixUnitaire(new BigDecimal("150.00"));
        facture.setLignes(List.of(ligne));
        facture.calculateMontants();

        Paiement paiement = new Paiement();
        paiement.setId(7L);
        paiement.setFacture(facture);
        paiement.setMontant(new BigDecimal("100.00"));
        paiement.setReferenceTransaction("TX-3");
        paiement.setStatut(StatutPaiement.EN_ATTENTE);

        PaiementResponse response = new PaiementResponse(
                7L, 3L, new BigDecimal("100.00"), ModePaiement.VIREMENT,
                "TX-3", StatutPaiement.VALIDE, null, null
        );

        when(paiementRepository.findById(7L)).thenReturn(Optional.of(paiement));
        when(factureRepository.save(facture)).thenReturn(facture);
        when(paiementRepository.save(paiement)).thenReturn(paiement);
        when(paiementMapper.toResponse(paiement)).thenReturn(response);

        paiementService.validatePayment(7L);

        verify(comptabiliteService).enregistrerReceptionPaiement(paiement);
        verify(financeEventPublisher).publishPaymentValidated(any(PaymentEvent.class));
        verify(financeMetrics).incrementPaymentsValidated();
    }
}
