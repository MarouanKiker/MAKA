package com.maka.finance.invoicing_service.repositories;

import com.maka.finance.invoicing_service.entities.CompteBancaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompteBancaireRepository extends JpaRepository<CompteBancaire, Long> {
}
