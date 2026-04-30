package com.maka.hr.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "demandes_conge")
public class DemandeConge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Temporal(TemporalType.DATE)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private Date dateDebut;

    @Temporal(TemporalType.DATE)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private Date dateFin;

    // e.g., "Maladie", "CP", "RTT"
    private String type;
    
    @Column(columnDefinition = "TEXT")
    private String motif;

    // "EnAttente", "Validé", "Refusé"
    private String etat;

    private LocalDateTime dateDemande;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employe_id")
    private Employe employe;

    public DemandeConge() {
        this.dateDemande = LocalDateTime.now();
        this.etat = "EnAttente";
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Date getDateDebut() { return dateDebut; }
    public void setDateDebut(Date dateDebut) { this.dateDebut = dateDebut; }

    public Date getDateFin() { return dateFin; }
    public void setDateFin(Date dateFin) { this.dateFin = dateFin; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }

    public String getEtat() { return etat; }
    public void setEtat(String etat) { this.etat = etat; }

    public LocalDateTime getDateDemande() { return dateDemande; }
    public void setDateDemande(LocalDateTime dateDemande) { this.dateDemande = dateDemande; }

    public Employe getEmploye() { return employe; }
    public void setEmploye(Employe employe) { this.employe = employe; }
}
