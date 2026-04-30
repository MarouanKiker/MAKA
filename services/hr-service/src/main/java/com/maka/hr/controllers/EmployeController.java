package com.maka.hr.controllers;

import com.maka.hr.models.Employe;
import com.maka.hr.repositories.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/employes")
public class EmployeController {

    @Autowired
    private EmployeRepository employeRepository;

    // Récupérer la liste complète des employés
    @GetMapping
    public List<Employe> getAllEmployes() {
        return employeRepository.findAll();
    }

    // Créer un nouvel employé (Normalement fait par un ResponsableRH)
    @PostMapping
    public ResponseEntity<Employe> createEmploye(@RequestBody Employe employe) {
        Employe saved = employeRepository.save(employe);
        return ResponseEntity.ok(saved);
    }

    // Trouver un employé spécifique
    @GetMapping("/{id}")
    public ResponseEntity<Employe> getEmployeById(@PathVariable Long id) {
        return employeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Supprimer un employé
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmploye(@PathVariable Long id) {
        if (!employeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        employeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    // Trouver un employé par son email (utilisé par l'Espace Employé)
    @GetMapping("/by-email/{email}")
    public ResponseEntity<Employe> getEmployeByEmail(@PathVariable String email) {
        return employeRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
