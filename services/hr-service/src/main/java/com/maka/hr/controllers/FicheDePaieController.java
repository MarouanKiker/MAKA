package com.maka.hr.controllers;

import com.maka.hr.models.FicheDePaie;
import com.maka.hr.services.FicheDePaieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/paie")
public class FicheDePaieController {

    @Autowired
    private FicheDePaieService ficheDePaieService;

    // Lister TOUTES les fiches de paie (pour le frontend)
    @GetMapping
    public ResponseEntity<List<FicheDePaie>> getAllFiches() {
        return ResponseEntity.ok(ficheDePaieService.listerToutes());
    }

    // 1. Bouton "Générer la paie" pour un employé sur un mois précis
    @PostMapping("/generer/{employeId}")
    public ResponseEntity<?> genererFicheDePaie(
            @PathVariable Long employeId, 
            @RequestParam Integer mois, 
            @RequestParam Integer annee) {
        try {
            FicheDePaie nouvelleFiche = ficheDePaieService.genererFiche(employeId, mois, annee);
            return ResponseEntity.ok(nouvelleFiche);
        } catch (RuntimeException e) {
            // Renvoie le message d'erreur si contrat inexistant ou déjà généré
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. L'employé consulte son coffre-fort de fiches de paie
    @GetMapping("/employe/{employeId}")
    public ResponseEntity<List<FicheDePaie>> getFichesDeEmploye(@PathVariable Long employeId) {
        return ResponseEntity.ok(ficheDePaieService.consulterFichesEmploye(employeId));
    }
}
