package com.maka.hr.repositories;

import com.maka.hr.models.Employe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {

    // Chercher un employé via son identifiant global Auth
    Optional<Employe> findByAuthUserId(Long authUserId);

    // Chercher un employé via son email professionnel
    Optional<Employe> findByEmail(String email);

    // Compter le nombre d'employés par département
    long countByDepartement(String departement);
}
