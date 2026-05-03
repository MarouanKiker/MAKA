package com.maka.hr.repositories;

import com.maka.hr.models.DemandeRH;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DemandeRHRepository extends JpaRepository<DemandeRH, Long> {
    List<DemandeRH> findByStatut(String statut);
    List<DemandeRH> findByType(String type);
    List<DemandeRH> findByEmployeId(Long employeId);
    List<DemandeRH> findAllByOrderByDateCreationDesc();
}
