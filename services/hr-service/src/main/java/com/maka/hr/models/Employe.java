package com.maka.hr.models;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "role_hr", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("EMPLOYE")
@Table(name = "employes")
public class Employe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Référence vers l'utilisateur global dans le Auth Service
    @Column(name = "auth_user_id", unique = true)
    private Long authUserId;

    private String nom;
    private String email;
    
    @Temporal(TemporalType.DATE)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private Date dateEmbauche;

    // --- Relations (Basé sur le diagramme de classe) ---

    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Contrat> contrats;

    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<DemandeConge> demandesConge;

    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Reclamation> reclamations;

    @OneToMany(mappedBy = "employe", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<FicheDePaie> fichesDePaie;

    // --- Getters et Setters obligatoires ---
    
    public Employe() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAuthUserId() { return authUserId; }
    public void setAuthUserId(Long authUserId) { this.authUserId = authUserId; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Date getDateEmbauche() { return dateEmbauche; }
    public void setDateEmbauche(Date dateEmbauche) { this.dateEmbauche = dateEmbauche; }

    public List<Contrat> getContrats() { return contrats; }
    public void setContrats(List<Contrat> contrats) { this.contrats = contrats; }

    public List<DemandeConge> getDemandesConge() { return demandesConge; }
    public void setDemandesConge(List<DemandeConge> demandesConge) { this.demandesConge = demandesConge; }

    public List<Reclamation> getReclamations() { return reclamations; }
    public void setReclamations(List<Reclamation> reclamations) { this.reclamations = reclamations; }

    public List<FicheDePaie> getFichesDePaie() { return fichesDePaie; }
    public void setFichesDePaie(List<FicheDePaie> fichesDePaie) { this.fichesDePaie = fichesDePaie; }
}
