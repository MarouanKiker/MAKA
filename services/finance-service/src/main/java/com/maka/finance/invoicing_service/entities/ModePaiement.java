package com.maka.finance.invoicing_service.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "modes_paiement")
@Getter
@Setter
@NoArgsConstructor
public class ModePaiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String libelle; // Virement, Chèque, Espèces, Carte Bancaire

    @Column(nullable = false)
    private boolean actif = true;

    public ModePaiement(String libelle) {
        this.libelle = libelle;
    }
}
