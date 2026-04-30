package com.maka.hr.controllers;

import com.maka.hr.models.Reclamation;
import com.maka.hr.services.ReclamationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/reclamations")
public class ReclamationController {

    @Autowired
    private ReclamationService reclamationService;

    // Lister TOUTES les réclamations (pour le frontend)
    @GetMapping
    public ResponseEntity<List<Reclamation>> getAllReclamations() {
        return ResponseEntity.ok(reclamationService.listerToutes());
    }

    // POST /api/hr/reclamations/employe/1 (Création du ticket)
    @PostMapping("/employe/{employeId}")
    public ResponseEntity<Reclamation> soumettreReclamation(@PathVariable Long employeId, @RequestBody Reclamation reclamation) {
        try {
            return ResponseEntity.ok(reclamationService.soumettreReclamation(employeId, reclamation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // GET /api/hr/reclamations/ouvertes (Vision RH manager)
    @GetMapping("/ouvertes")
    public ResponseEntity<List<Reclamation>> getReclamationsOuvertes() {
        return ResponseEntity.ok(reclamationService.listerOuvertes());
    }

    // GET /api/hr/reclamations/employe/1 (Historique Employe)
    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<Reclamation>> getHistoriqueEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(reclamationService.listerParEmploye(employeId));
    }

    // PUT /api/hr/reclamations/1/traiter (Action RH)
    @PutMapping("/{id}/traiter")
    public ResponseEntity<Reclamation> traiterReclamation(@PathVariable Long id, @RequestBody(required = false) String reponseHR) {
        try {
            return ResponseEntity.ok(reclamationService.traiterReclamation(id, reponseHR != null ? reponseHR : "Traité"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
