package com.maka.hr.services;

import com.maka.hr.models.Employe;
import com.maka.hr.models.Reclamation;
import com.maka.hr.repositories.EmployeRepository;
import com.maka.hr.repositories.ReclamationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReclamationService {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private EmployeRepository employeRepository;

    // L'employé dépose une plainte (Bloque le statut en Ouvert pour éviter la fraude)
    public Reclamation soumettreReclamation(Long employeId, Reclamation reclamation) {
        Optional<Employe> employeOpt = employeRepository.findById(employeId);
        if (employeOpt.isEmpty()) {
            throw new RuntimeException("Employé introuvable");
        }
        reclamation.setEmploye(employeOpt.get());
        reclamation.setStatut("Ouvert");
        reclamation.setDateEnvoi(LocalDateTime.now());
        return reclamationRepository.save(reclamation);
    }

    // Le manager RH répond au rapport
    public Reclamation traiterReclamation(Long reclamationId, String reponseHR) {
        Optional<Reclamation> recOpt = reclamationRepository.findById(reclamationId);
        if (recOpt.isEmpty()) {
            throw new RuntimeException("Réclamation introuvable");
        }
        Reclamation rec = recOpt.get();
        if ("Résolu".equals(rec.getStatut())) {
            throw new RuntimeException("Cette réclamation a déjà été résolue.");
        }
        rec.setReponseRH(reponseHR);
        rec.setStatut("Résolu");
        return reclamationRepository.save(rec);
    }

    public List<Reclamation> listerParEmploye(Long employeId) {
        return reclamationRepository.findByEmployeId(employeId);
    }

    public List<Reclamation> listerOuvertes() {
        return reclamationRepository.findByStatut("Ouvert");
    }

    // Lister TOUTES les réclamations (pour le frontend)
    public List<Reclamation> listerToutes() {
        return reclamationRepository.findAll();
    }
}
