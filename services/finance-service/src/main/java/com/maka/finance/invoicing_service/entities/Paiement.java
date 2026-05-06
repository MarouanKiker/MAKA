package com.maka.finance.invoicing_service.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "paiements")
@Getter
@Setter
@NoArgsConstructor
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_paiement", nullable = false)
    private OffsetDateTime datePaiement;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montant;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mode_paiement_id")
    private ModePaiement modePaiement;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "compte_bancaire_id")
    private CompteBancaire compteBancaire;

    @Column(name = "reference_transaction", nullable = false, unique = true, length = 120)
    private String referenceTransaction;

    @Column(nullable = false, length = 20)
    private String type; // "CLIENT" ou "FOURNISSEUR"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    @Column(name = "date_creation", nullable = false)
    private OffsetDateTime dateCreation;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (datePaiement == null) {
            datePaiement = now;
        }
        this.dateCreation = now;
    }
}
