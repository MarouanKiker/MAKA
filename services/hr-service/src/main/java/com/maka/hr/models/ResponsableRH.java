package com.maka.hr.models;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("RESPONSABLE_RH")
public class ResponsableRH extends Employe {
    
    // Le diagramme UML affiche un attribut "niveauAcces" spécifique
    private Integer niveauAcces;

    public ResponsableRH() {
        super();
    }

    public Integer getNiveauAcces() {
        return niveauAcces;
    }

    public void setNiveauAcces(Integer niveauAcces) {
        this.niveauAcces = niveauAcces;
    }
    
    // Les méthodes (creerEmploye, validerDemande, etc.) seront implémentées 
    // dans la couche Services (ResponsableRHService ou EmployeService).
}
