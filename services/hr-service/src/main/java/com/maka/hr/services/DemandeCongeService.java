package com.maka.hr.services;

import com.maka.hr.models.DemandeConge;
import com.maka.hr.models.Employe;
import com.maka.hr.repositories.DemandeCongeRepository;
import com.maka.hr.repositories.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DemandeCongeService {

    @Autowired
    private DemandeCongeRepository demandeCongeRepository;

    @Autowired
    private EmployeRepository employeRepository;

    // Un employé pose un congé
    public DemandeConge poserConge(Long employeId, DemandeConge demande) {
        Optional<Employe> employeOpt = employeRepository.findById(employeId);
        if (employeOpt.isEmpty()) {
            throw new RuntimeException("Employé introuvable");
        }
        
        demande.setEmploye(employeOpt.get());
        demande.setEtat("EnAttente");  // Validation de sécurité : forcer l'état initial
        demande.setDateDemande(LocalDateTime.now());
        
        return demandeCongeRepository.save(demande);
    }

    // Le Manager RH valide ou refuse le congé
    public DemandeConge traiterDemande(Long demandeId, boolean estAccepte, String reponseRH) {
        Optional<DemandeConge> demandeOpt = demandeCongeRepository.findById(demandeId);
        if (demandeOpt.isEmpty()) {
            throw new RuntimeException("Demande de congé introuvable");
        }
        
        DemandeConge demande = demandeOpt.get();
        if ("Validé".equals(demande.getEtat()) || "Refusé".equals(demande.getEtat())) {
            throw new RuntimeException("Cette demande a déjà été traitée.");
        }

        demande.setEtat(estAccepte ? "Validé" : "Refusé");
        // On pourrait ajouter le champ reponseRH s'il existait sur le modèle, 
        // ou l'enregistrer dans une trace système.
        
        return demandeCongeRepository.save(demande);
    }

    // Consulter les listes
    public List<DemandeConge> listerCongesEmploye(Long employeId) {
        return demandeCongeRepository.findByEmployeId(employeId);
    }

    public List<DemandeConge> listerCongesEnAttente() {
        return demandeCongeRepository.findByEtat("EnAttente");
    }

    // Lister TOUS les congés (pour le frontend)
    public List<DemandeConge> listerTous() {
        return demandeCongeRepository.findAll();
    }
}
