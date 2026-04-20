package com.maka.finance.invoicing_service.repositories;

import com.maka.finance.invoicing_service.entities.JournalTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalTransactionRepository extends JpaRepository<JournalTransaction, Long> {
    List<JournalTransaction> findByCompteDebitOrCompteCreditOrderByDateEcritureDesc(String compteDebit, String compteCredit);
    List<JournalTransaction> findByReferenceTypeAndReferenceIdOrderByDateEcritureDesc(String referenceType, Long referenceId);
}
