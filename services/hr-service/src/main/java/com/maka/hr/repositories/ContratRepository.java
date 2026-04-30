package com.maka.hr.repositories;

import com.maka.hr.models.Contrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContratRepository extends JpaRepository<Contrat, Long> {

    // Récupérer le ou les contrats d'un employé (pour trouver son salaire brut)
    List<Contrat> findByEmployeId(Long employeId);
}
