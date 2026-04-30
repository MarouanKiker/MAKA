package com.maka.hr.services;

import com.maka.hr.models.Contrat;
import com.maka.hr.models.Employe;
import com.maka.hr.models.FicheDePaie;
import com.maka.hr.repositories.ContratRepository;
import com.maka.hr.repositories.EmployeRepository;
import com.maka.hr.repositories.FicheDePaieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FicheDePaieService {

    @Autowired
    private FicheDePaieRepository ficheDePaieRepository;

    @Autowired
    private EmployeRepository employeRepository;

    @Autowired
    private ContratRepository contratRepository;

    // La "Machine à générer de la monnaie"
    public FicheDePaie genererFiche(Long employeId, Integer mois, Integer annee) {
        
        // 1. Vérifications de sécurité et de doublons
        Optional<Employe> employeOpt = employeRepository.findById(employeId);
        if (employeOpt.isEmpty()) {
            throw new RuntimeException("Employé introuvable");
        }
        
        Optional<FicheDePaie> existante = ficheDePaieRepository.findByEmployeIdAndMoisAndAnnee(employeId, mois, annee);
        if (existante.isPresent()) {
            throw new RuntimeException("La fiche de paie a déjà été générée pour ce mois !");
        }

        // 2. Recherche du contrat pour extraire la base salariale (Salaire Brut)
        List<Contrat> contrats = contratRepository.findByEmployeId(employeId);
        if (contrats.isEmpty()) {
            throw new RuntimeException("L'employé n'a pas de contrat actif pour calculer la paie.");
        }
        
        // On prend le contrat le plus récent (simplifié au 1er de la liste ici)
        Contrat contratActif = contrats.get(contrats.size() - 1);
        Double salaireBrut = contratActif.getSalaireBrut();
        
        if (salaireBrut == null || salaireBrut <= 0) {
            throw new RuntimeException("Salaire brut invalide sur le contrat.");
        }

        // 3. Algorithme Mathématique du salaire
        double tauxCotisation = 0.20; // 20%
        double cotisations = salaireBrut * tauxCotisation;
        double salaireNet = salaireBrut - cotisations;

        // 4. Création de la fiche finale
        FicheDePaie fiche = new FicheDePaie();
        fiche.setEmploye(employeOpt.get());
        fiche.setMois(mois);
        fiche.setAnnee(annee);
        fiche.setSalaireBrut(salaireBrut);
        fiche.setCotisations(cotisations);
        fiche.setSalaireNet(salaireNet);
        fiche.setStatut("Emise"); // Pourrait être "EnAttenteDePaiement" vers le module Finance

        return ficheDePaieRepository.save(fiche);
    }

    public List<FicheDePaie> consulterFichesEmploye(Long employeId) {
        return ficheDePaieRepository.findByEmployeId(employeId);
    }

    // Lister TOUTES les fiches de paie (pour le frontend)
    public List<FicheDePaie> listerToutes() {
        return ficheDePaieRepository.findAll();
    }
}
