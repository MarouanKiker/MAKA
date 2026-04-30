package com.maka.hr.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamations")
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sujet;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDateTime dateEnvoi;

    @Column(columnDefinition = "TEXT")
    private String reponseRH;

    private String statut; // "Ouvert", "Résolu"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employe_id")
    private Employe employe;

    public Reclamation() {
        this.dateEnvoi = LocalDateTime.now();
        this.statut = "Ouvert";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSujet() { return sujet; }
    public void setSujet(String sujet) { this.sujet = sujet; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDateEnvoi() { return dateEnvoi; }
    public void setDateEnvoi(LocalDateTime dateEnvoi) { this.dateEnvoi = dateEnvoi; }

    public String getReponseRH() { return reponseRH; }
    public void setReponseRH(String reponseRH) { this.reponseRH = reponseRH; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public Employe getEmploye() { return employe; }
    public void setEmploye(Employe employe) { this.employe = employe; }
}
