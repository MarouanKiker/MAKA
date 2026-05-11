package com.maka.finance.invoicing_service.services;

import com.maka.finance.invoicing_service.dto.CreatePaiementRequest;
import com.maka.finance.invoicing_service.dto.PaiementResponse;
import com.maka.finance.invoicing_service.dto.event.PaymentEvent;
import com.maka.finance.invoicing_service.entities.*;
import com.maka.finance.invoicing_service.events.FinanceEventPublisher;
import com.maka.finance.invoicing_service.exceptions.BusinessException;
import com.maka.finance.invoicing_service.exceptions.ResourceNotFoundException;
import com.maka.finance.invoicing_service.metrics.FinanceMetrics;
import com.maka.finance.invoicing_service.mappers.PaiementMapper;
import com.maka.finance.invoicing_service.repositories.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final FactureRepository factureRepository;
    private final CompteBancaireRepository compteBancaireRepository;
    private final ModePaiementRepository modePaiementRepository;
    private final PaiementMapper paiementMapper;
    private final ComptabiliteService comptabiliteService;
    private final FinanceEventPublisher financeEventPublisher;
    private final FinanceMetrics financeMetrics;

    public PaiementService(
            PaiementRepository paiementRepository,
            FactureRepository factureRepository,
            CompteBancaireRepository compteBancaireRepository,
            ModePaiementRepository modePaiementRepository,
            PaiementMapper paiementMapper,
            ComptabiliteService comptabiliteService,
            FinanceEventPublisher financeEventPublisher,
            FinanceMetrics financeMetrics
    ) {
        this.paiementRepository = paiementRepository;
        this.factureRepository = factureRepository;
        this.compteBancaireRepository = compteBancaireRepository;
        this.modePaiementRepository = modePaiementRepository;
        this.paiementMapper = paiementMapper;
        this.comptabiliteService = comptabiliteService;
        this.financeEventPublisher = financeEventPublisher;
        this.financeMetrics = financeMetrics;
    }

    @CacheEvict(value = "paiements", allEntries = true)
    public PaiementResponse create(@Valid CreatePaiementRequest request) {
        if (request.referenceTransaction() != null && !request.referenceTransaction().isBlank()
                && paiementRepository.existsByReferenceTransaction(request.referenceTransaction())) {
            Paiement existing = paiementRepository.findByReferenceTransaction(request.referenceTransaction())
                    .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable pour la référence donnée"));
            return paiementMapper.toResponse(existing);
        }

        Facture facture = factureRepository.findById(request.factureId())
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable avec id=" + request.factureId()));

        ModePaiement mode = modePaiementRepository.findById(request.modePaiementId())
                .orElseThrow(() -> new ResourceNotFoundException("Mode de paiement introuvable"));

        CompteBancaire compte = null;
        if (request.compteBancaireId() != null) {
            compte = compteBancaireRepository.findById(request.compteBancaireId())
                    .orElseThrow(() -> new ResourceNotFoundException("Compte bancaire introuvable"));
        }

        if (facture.getStatut() != StatutFacture.ENVOYEE
                && facture.getStatut() != StatutFacture.VALIDEE
                && facture.getStatut() != StatutFacture.PARTIELLEMENT_PAYEE) {
            throw new BusinessException("Paiement autorisé seulement pour les factures VALIDEE, ENVOYEE ou PARTIELLEMENT_PAYEE.");
        }

        Paiement paiement = paiementMapper.toEntity(request, facture);
        paiement.setModePaiement(mode);
        paiement.setCompteBancaire(compte);
        paiement.setStatut(StatutPaiement.EN_ATTENTE);
        
        Paiement saved = paiementRepository.save(paiement);
        financeEventPublisher.publishPaymentReceived(toEvent(saved));
        financeMetrics.incrementPaymentsReceived();
        financeMetrics.recordPaymentAmount(saved.getMontant().doubleValue());
        return paiementMapper.toResponse(saved);
    }

    @CacheEvict(value = "paiements", allEntries = true)
    public PaiementResponse validatePayment(Long paiementId) {
        Paiement paiement = findByIdOrThrow(paiementId);

        if (paiement.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new BusinessException("Seuls les paiements EN_ATTENTE peuvent être validés.");
        }

        // 1. Appliquer le paiement sur la facture
        Facture facture = paiement.getFacture();
        facture.appliquerPaiement(paiement.getMontant());
        factureRepository.save(facture);

        // 2. Mettre à jour le solde bancaire si un compte est lié
        if (paiement.getCompteBancaire() != null) {
            if ("CLIENT".equals(paiement.getType())) {
                paiement.getCompteBancaire().credit(paiement.getMontant());
            } else {
                paiement.getCompteBancaire().debit(paiement.getMontant());
            }
            compteBancaireRepository.save(paiement.getCompteBancaire());
        }

        // 3. Valider le paiement
        paiement.setStatut(StatutPaiement.VALIDE);
        Paiement saved = paiementRepository.save(paiement);
        
        // 4. Écriture comptable au journal
        comptabiliteService.enregistrerReceptionPaiement(saved);
        
        financeEventPublisher.publishPaymentValidated(toEvent(saved));
        financeMetrics.incrementPaymentsValidated();
        return paiementMapper.toResponse(saved);
    }

    @CacheEvict(value = "paiements", allEntries = true)
    public PaiementResponse rejectPayment(Long paiementId) {
        Paiement paiement = findByIdOrThrow(paiementId);
        if (paiement.getStatut() != StatutPaiement.EN_ATTENTE) {
            throw new BusinessException("Seuls les paiements EN_ATTENTE peuvent être rejetés.");
        }
        paiement.setStatut(StatutPaiement.REJETE);
        Paiement saved = paiementRepository.save(paiement);
        financeEventPublisher.publishPaymentRejected(toEvent(saved));
        return paiementMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "paiements", key = "#paiementId")
    public PaiementResponse getById(Long paiementId) {
        return paiementMapper.toResponse(findByIdOrThrow(paiementId));
    }

    @Transactional(readOnly = true)
    public List<PaiementResponse> getAll() {
        return paiementRepository.findAll().stream()
                .map(paiementMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaiementResponse> getByFactureId(Long factureId) {
        if (!factureRepository.existsById(factureId)) {
            throw new ResourceNotFoundException("Facture introuvable avec id=" + factureId);
        }
        return paiementRepository.findByFactureId(factureId)
                .stream()
                .map(paiementMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Paiement findByIdOrThrow(Long paiementId) {
        return paiementRepository.findById(paiementId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable avec id=" + paiementId));
    }

    private PaymentEvent toEvent(Paiement paiement) {
        return new PaymentEvent(
                paiement.getId(),
                paiement.getFacture().getId(),
                paiement.getMontant(),
                paiement.getReferenceTransaction(),
                paiement.getStatut().name()
        );
    }
}
