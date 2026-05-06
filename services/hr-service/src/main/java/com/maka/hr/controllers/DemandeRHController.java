package com.maka.hr.controllers;

import com.maka.hr.models.DemandeRH;
import com.maka.hr.models.Employe;
import com.maka.hr.repositories.DemandeRHRepository;
import com.maka.hr.repositories.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/hr/demandes")
public class DemandeRHController {

    @Autowired private DemandeRHRepository demandeRHRepository;
    @Autowired private EmployeRepository employeRepository;

    // Toutes les demandes (tri par date décroissant)
    @GetMapping
    public List<DemandeRH> getAll() {
        return demandeRHRepository.findAllByOrderByDateCreationDesc();
    }

    // Demandes d'un employé spécifique
    @GetMapping("/employe/{employeId}")
    public List<DemandeRH> getByEmploye(@PathVariable Long employeId) {
        return demandeRHRepository.findByEmployeId(employeId);
    }

    // Créer une demande pour un employé
    @PostMapping("/employe/{employeId}")
    public ResponseEntity<?> create(@PathVariable Long employeId, @RequestBody DemandeRH demande) {
        Optional<Employe> emp = employeRepository.findById(employeId);
        if (emp.isEmpty()) return ResponseEntity.badRequest().body("Employé introuvable");
        demande.setEmploye(emp.get());
        return ResponseEntity.ok(demandeRHRepository.save(demande));
    }

    // Traiter une demande : changer statut + écrire réponse RH
    @PutMapping("/{id}/traiter")
    public ResponseEntity<?> traiter(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<DemandeRH> opt = demandeRHRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        DemandeRH d = opt.get();
        if (body.containsKey("statut")) d.setStatut(body.get("statut"));
        if (body.containsKey("reponseRH")) d.setReponseRH(body.get("reponseRH"));
        d.setDateTraitement(LocalDateTime.now());
        return ResponseEntity.ok(demandeRHRepository.save(d));
    }

    // Supprimer une demande
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!demandeRHRepository.existsById(id)) return ResponseEntity.notFound().build();
        demandeRHRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
