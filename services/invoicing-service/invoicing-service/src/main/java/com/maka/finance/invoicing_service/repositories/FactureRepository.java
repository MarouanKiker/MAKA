package com.maka.finance.invoicing_service.repositories;

import com.maka.finance.invoicing_service.entities.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {
    Optional<Facture> findByNumero(String numero);
    boolean existsByNumero(String numero);
}