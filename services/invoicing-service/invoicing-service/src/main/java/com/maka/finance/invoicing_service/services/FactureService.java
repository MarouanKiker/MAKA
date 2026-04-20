package com.maka.finance.invoicing_service.services;

import com.maka.finance.invoicing_service.dto.FactureRequest;
import com.maka.finance.invoicing_service.dto.FactureResponse;
import com.maka.finance.invoicing_service.dto.PaiementRequest;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.StatutFacture;
import com.maka.finance.invoicing_service.dto.event.InvoiceEvent;
import com.maka.finance.invoicing_service.events.FinanceEventPublisher;
import com.maka.finance.invoicing_service.exceptions.BusinessException;
import com.maka.finance.invoicing_service.exceptions.ResourceNotFoundException;
import com.maka.finance.invoicing_service.metrics.FinanceMetrics;
import com.maka.finance.invoicing_service.mappers.FactureMapper;
import com.maka.finance.invoicing_service.repositories.FactureRepository;
import jakarta.validation.Valid;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class FactureService {

    private static final Map<StatutFacture, Set<StatutFacture>> TRANSITIONS = Map.of(
            StatutFacture.BROUILLON, Set.of(StatutFacture.VALIDEE, StatutFacture.ANNULEE),
            StatutFacture.VALIDEE, Set.of(StatutFacture.ENVOYEE, StatutFacture.ANNULEE),
            StatutFacture.ENVOYEE, Set.of(StatutFacture.PARTIELLEMENT_PAYEE, StatutFacture.PAYEE),
            StatutFacture.PARTIELLEMENT_PAYEE, Set.of(StatutFacture.PAYEE)
    );

    private final FactureRepository factureRepository;
    private final FactureMapper factureMapper;
    private final ComptabiliteService comptabiliteService;
    private final FinanceEventPublisher financeEventPublisher;
    private final FinanceMetrics financeMetrics;

    public FactureService(
            FactureRepository factureRepository,
            FactureMapper factureMapper,
            ComptabiliteService comptabiliteService,
            FinanceEventPublisher financeEventPublisher,
            FinanceMetrics financeMetrics
    ) {
        this.factureRepository = factureRepository;
        this.factureMapper = factureMapper;
        this.comptabiliteService = comptabiliteService;
        this.financeEventPublisher = financeEventPublisher;
        this.financeMetrics = financeMetrics;
    }

    @CacheEvict(value = "factures", allEntries = true)
    public FactureResponse create(@Valid FactureRequest request) {
        if (factureRepository.existsByNumero(request.numero())) {
            throw new BusinessException("Une facture avec ce numéro existe déjà.");
        }

        Facture facture = factureMapper.toEntity(request);
        facture.calculateMontants();
        Facture saved = factureRepository.save(facture);
        financeMetrics.incrementInvoicesCreated();
        return factureMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "factures", key = "#id")
    public FactureResponse getById(Long id) {
        return factureMapper.toResponse(findByIdOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<FactureResponse> getAll() {
        return factureRepository.findAll()
                .stream()
                .map(factureMapper::toResponse)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "factures", allEntries = true)
    public FactureResponse update(Long id, @Valid FactureRequest request) {
        Facture facture = findByIdOrThrow(id);
        if (!facture.getNumero().equals(request.numero()) && factureRepository.existsByNumero(request.numero())) {
            throw new BusinessException("Une facture avec ce numéro existe déjà.");
        }

        factureMapper.updateEntity(facture, request);
        facture.calculateMontants();
        return factureMapper.toResponse(factureRepository.save(facture));
    }

    @CacheEvict(value = "factures", allEntries = true)
    public void delete(Long id) {
        Facture facture = findByIdOrThrow(id);
        factureRepository.delete(facture);
    }

    @CacheEvict(value = "factures", allEntries = true)
    public FactureResponse appliquerPaiement(Long id, @Valid PaiementRequest request) {
        Facture facture = findByIdOrThrow(id);
        facture.appliquerPaiement(request.montant());
        return factureMapper.toResponse(factureRepository.save(facture));
    }

    @CacheEvict(value = "factures", allEntries = true)
    public FactureResponse changeStatus(Long id, StatutFacture nouveauStatut) {
        Facture facture = findByIdOrThrow(id);
        StatutFacture statutActuel = facture.getStatut();

        Set<StatutFacture> transitions = TRANSITIONS.getOrDefault(statutActuel, Set.of());
        if (!transitions.contains(nouveauStatut)) {
            throw new BusinessException("Transition de statut invalide: " + statutActuel + " -> " + nouveauStatut);
        }

        facture.setStatut(nouveauStatut);
        Facture saved = factureRepository.save(facture);

        if (nouveauStatut == StatutFacture.VALIDEE) {
            comptabiliteService.enregistrerEmissionFacture(saved);
            financeEventPublisher.publishInvoiceValidated(new InvoiceEvent(
                    saved.getId(),
                    saved.getNumero(),
                    saved.getMontantHT(),
                    saved.getMontantTVA(),
                    saved.getMontantTTC()
            ));
        }

        return factureMapper.toResponse(saved);
    }

    private Facture findByIdOrThrow(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable avec id=" + id));
    }
}