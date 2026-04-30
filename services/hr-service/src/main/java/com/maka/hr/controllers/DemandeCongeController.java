package com.maka.hr.controllers;

import com.maka.hr.models.DemandeConge;
import com.maka.hr.services.DemandeCongeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/conges")
public class DemandeCongeController {

    @Autowired
    private DemandeCongeService demandeCongeService;

    // Lister TOUS les congés (pour le frontend)
    @GetMapping
    public ResponseEntity<List<DemandeConge>> getAllConges() {
        return ResponseEntity.ok(demandeCongeService.listerTous());
    }

    // 1. L'employé soumet une demande de congé
    @PostMapping("/employe/{employeId}")
    public ResponseEntity<DemandeConge> poserUnConge(@PathVariable Long employeId, @RequestBody DemandeConge demande) {
        try {
            DemandeConge saved = demandeCongeService.poserConge(employeId, demande);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 2. Le Manager consulte TOUTES les demandes en attente
    @GetMapping("/en-attente")
    public ResponseEntity<List<DemandeConge>> getCongesEnAttente() {
        return ResponseEntity.ok(demandeCongeService.listerCongesEnAttente());
    }

    // 3. L'employé consulte SON historique personnel
    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<DemandeConge>> getCongesDeEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(demandeCongeService.listerCongesEmploye(employeId));
    }

    // 4. Le Manager prend une décision (Valider ou Refuser)
    @PutMapping("/{id}/decision")
    public ResponseEntity<DemandeConge> deciderConge(
            @PathVariable Long id, 
            @RequestParam boolean accepter, 
            @RequestParam(required = false) String reponseRH) {
        try {
            DemandeConge miseAJour = demandeCongeService.traiterDemande(id, accepter, reponseRH);
            return ResponseEntity.ok(miseAJour);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
