package com.maka.hr.controllers;

import com.maka.hr.models.Contrat;
import com.maka.hr.models.Employe;
import com.maka.hr.repositories.ContratRepository;
import com.maka.hr.repositories.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/hr/contrats")
public class ContratController {

    @Autowired
    private ContratRepository contratRepository;

    @Autowired
    private EmployeRepository employeRepository;

    // Lister TOUS les contrats
    @GetMapping
    public List<Contrat> getAllContrats() {
        return contratRepository.findAll();
    }

    // Lister les contrats d'un employé
    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<Contrat>> getContratsByEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(contratRepository.findByEmployeId(employeId));
    }

    // Créer un contrat pour un employé
    @PostMapping("/employe/{employeId}")
    public ResponseEntity<?> createContrat(@PathVariable Long employeId, @RequestBody Contrat contrat) {
        Optional<Employe> employeOpt = employeRepository.findById(employeId);
        if (employeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employé introuvable");
        }
        contrat.setEmploye(employeOpt.get());
        Contrat saved = contratRepository.save(contrat);
        return ResponseEntity.ok(saved);
    }

    // Modifier un contrat
    @PutMapping("/{id}")
    public ResponseEntity<?> updateContrat(@PathVariable Long id, @RequestBody Contrat contratDetails) {
        Optional<Contrat> contratOpt = contratRepository.findById(id);
        if (contratOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Contrat contrat = contratOpt.get();
        if (contratDetails.getType() != null) contrat.setType(contratDetails.getType());
        if (contratDetails.getPoste() != null) contrat.setPoste(contratDetails.getPoste());
        if (contratDetails.getSalaireBrut() != null) contrat.setSalaireBrut(contratDetails.getSalaireBrut());
        if (contratDetails.getDateDebut() != null) contrat.setDateDebut(contratDetails.getDateDebut());
        if (contratDetails.getDateFin() != null) contrat.setDateFin(contratDetails.getDateFin());
        return ResponseEntity.ok(contratRepository.save(contrat));
    }

    // Supprimer un contrat
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContrat(@PathVariable Long id) {
        if (!contratRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        contratRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
