package com.maka.finance.invoicing_service.services;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.maka.finance.invoicing_service.dto.FactureRequest;
import com.maka.finance.invoicing_service.dto.FactureResponse;
import com.maka.finance.invoicing_service.dto.event.InvoiceEvent;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.StatutFacture;
import com.maka.finance.invoicing_service.events.FinanceEventPublisher;
import com.maka.finance.invoicing_service.exceptions.BusinessException;
import com.maka.finance.invoicing_service.mappers.FactureMapper;
import com.maka.finance.invoicing_service.metrics.FinanceMetrics;
import com.maka.finance.invoicing_service.repositories.FactureRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FactureServiceTest {

    @Mock
    private FactureRepository factureRepository;
    @Mock
    private FactureMapper factureMapper;
    @Mock
    private ComptabiliteService comptabiliteService;
    @Mock
    private FinanceEventPublisher financeEventPublisher;
    @Mock
    private FinanceMetrics financeMetrics;

    private FactureService factureService;

    @BeforeEach
    void setUp() {
        factureService = new FactureService(
                factureRepository,
                factureMapper,
                comptabiliteService,
                financeEventPublisher,
                financeMetrics
        );
    }

    @Test
    void create_shouldThrow_whenNumeroAlreadyExists() {
        FactureRequest request = new FactureRequest("FAC-001", BigDecimal.valueOf(0.2), List.of());
        when(factureRepository.existsByNumero("FAC-001")).thenReturn(true);

        assertThrows(BusinessException.class, () -> factureService.create(request));
    }

    @Test
    void create_shouldSaveAndIncrementMetrics() {
        FactureRequest request = new FactureRequest("FAC-002", BigDecimal.valueOf(0.2), List.of());
        Facture facture = new Facture();
        facture.setNumero("FAC-002");

        FactureResponse response = new FactureResponse(
                1L, "FAC-002", BigDecimal.valueOf(0.2), BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                StatutFacture.BROUILLON, null, null, List.of()
        );

        when(factureRepository.existsByNumero("FAC-002")).thenReturn(false);
        when(factureMapper.toEntity(request)).thenReturn(facture);
        when(factureRepository.save(facture)).thenReturn(facture);
        when(factureMapper.toResponse(facture)).thenReturn(response);

        factureService.create(request);

        verify(factureRepository).save(facture);
        verify(financeMetrics).incrementInvoicesCreated();
    }

    @Test
    void changeStatus_shouldCallAccountingAndPublish_whenValidated() {
        Facture facture = new Facture();
        facture.setId(10L);
        facture.setNumero("FAC-010");
        facture.setStatut(StatutFacture.BROUILLON);
        facture.setMontantHT(new BigDecimal("100.00"));
        facture.setMontantTVA(new BigDecimal("20.00"));
        facture.setMontantTTC(new BigDecimal("120.00"));

        FactureResponse response = new FactureResponse(
                10L, "FAC-010", BigDecimal.valueOf(0.2), new BigDecimal("100.00"),
                new BigDecimal("20.00"), new BigDecimal("120.00"), BigDecimal.ZERO, new BigDecimal("120.00"),
                StatutFacture.VALIDEE, null, null, List.of()
        );

        when(factureRepository.findById(10L)).thenReturn(Optional.of(facture));
        when(factureRepository.save(facture)).thenReturn(facture);
        when(factureMapper.toResponse(facture)).thenReturn(response);

        factureService.changeStatus(10L, StatutFacture.VALIDEE);

        verify(comptabiliteService).enregistrerEmissionFacture(facture);
        verify(financeEventPublisher).publishInvoiceValidated(any(InvoiceEvent.class));
    }

    @Test
    void changeStatus_shouldThrow_whenTransitionInvalid() {
        Facture facture = new Facture();
        facture.setId(11L);
        facture.setStatut(StatutFacture.PAYEE);

        when(factureRepository.findById(11L)).thenReturn(Optional.of(facture));

        assertThrows(BusinessException.class, () -> factureService.changeStatus(11L, StatutFacture.BROUILLON));

        verify(factureRepository, never()).save(any());
        verify(comptabiliteService, never()).enregistrerEmissionFacture(any());
    }
}
