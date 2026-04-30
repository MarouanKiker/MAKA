package com.maka.hr.repositories;

import com.maka.hr.models.FicheDePaie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FicheDePaieRepository extends JpaRepository<FicheDePaie, Long> {

    // Historique des fiches d'un employé
    List<FicheDePaie> findByEmployeId(Long employeId);

    // Vérifier si une fiche existe déjà pour un mois donné (règle métier)
    Optional<FicheDePaie> findByEmployeIdAndMoisAndAnnee(Long employeId, Integer mois, Integer annee);
}
