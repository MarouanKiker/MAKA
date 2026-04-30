package com.maka.hr.models;

import jakarta.persistence.*;

@Entity
@Table(name = "fiches_paie")
public class FicheDePaie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer mois;
    private Integer annee;
    
    private Double salaireBrut;
    private Double cotisations;
    private Double salaireNet;
    
    private String statut;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employe_id")
    private Employe employe;

    public FicheDePaie() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getMois() { return mois; }
    public void setMois(Integer mois) { this.mois = mois; }

    public Integer getAnnee() { return annee; }
    public void setAnnee(Integer annee) { this.annee = annee; }

    public Double getSalaireBrut() { return salaireBrut; }
    public void setSalaireBrut(Double salaireBrut) { this.salaireBrut = salaireBrut; }

    public Double getCotisations() { return cotisations; }
    public void setCotisations(Double cotisations) { this.cotisations = cotisations; }

    public Double getSalaireNet() { return salaireNet; }
    public void setSalaireNet(Double salaireNet) { this.salaireNet = salaireNet; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Employe getEmploye() { return employe; }
    public void setEmploye(Employe employe) { this.employe = employe; }
}
