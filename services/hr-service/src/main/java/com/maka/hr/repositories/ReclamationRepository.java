package com.maka.hr.repositories;

import com.maka.hr.models.Reclamation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {
    List<Reclamation> findByEmployeId(Long employeId);
    List<Reclamation> findByStatut(String statut);
}
