package com.maka.finance.invoicing_service.repositories;

import com.maka.finance.invoicing_service.entities.Paiement;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    boolean existsByReferenceTransaction(String referenceTransaction);
    Optional<Paiement> findByReferenceTransaction(String referenceTransaction);
    List<Paiement> findByFactureId(Long factureId);
}
