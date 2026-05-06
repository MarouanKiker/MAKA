package com.maka.finance.invoicing_service.repositories;

import com.maka.finance.invoicing_service.entities.ModePaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ModePaiementRepository extends JpaRepository<ModePaiement, Long> {
    Optional<ModePaiement> findByLibelle(String libelle);
}
