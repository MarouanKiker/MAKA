package com.maka.hr.repositories;

import com.maka.hr.models.DemandeConge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeCongeRepository extends JpaRepository<DemandeConge, Long> {

    // Liste des congés d'un employé spécifique
    List<DemandeConge> findByEmployeId(Long employeId);

    // Liste de tous les congés ayant un statut particulier (ex: "EnAttente") pour le tableau de bord RH
    List<DemandeConge> findByEtat(String etat);
}
