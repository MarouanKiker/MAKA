package com.maka.finance.invoicing_service.entities;

import com.maka.finance.invoicing_service.exceptions.BusinessException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "factures")
@Getter
@Setter
@NoArgsConstructor
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String numero;

    @Column(name = "montant_ht", nullable = false, precision = 19, scale = 2)
    private BigDecimal montantHT = BigDecimal.ZERO;

    @Column(name = "taux_tva", nullable = false, precision = 5, scale = 4)
    private BigDecimal tauxTVA = new BigDecimal("0.2000");

    @Column(name = "montant_tva", nullable = false, precision = 19, scale = 2)
    private BigDecimal montantTVA = BigDecimal.ZERO;

    @Column(name = "montant_ttc", nullable = false, precision = 19, scale = 2)
    private BigDecimal montantTTC = BigDecimal.ZERO;

    @Column(name = "montant_paye", nullable = false, precision = 19, scale = 2)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(name = "reste_a_payer", nullable = false, precision = 19, scale = 2)
    private BigDecimal resteAPayer = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutFacture statut = StatutFacture.BROUILLON;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneFacture> lignes = new ArrayList<>();

    @Column(name = "date_creation", nullable = false)
    private OffsetDateTime dateCreation;

    @Column(name = "date_mise_a_jour", nullable = false)
    private OffsetDateTime dateMiseAJour;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.dateCreation = now;
        this.dateMiseAJour = now;
    }

    @PreUpdate
    void onUpdate() {
        this.dateMiseAJour = OffsetDateTime.now();
    }

    public void calculateMontants() {
        BigDecimal totalHt = BigDecimal.ZERO;

        for (LigneFacture ligne : lignes) {
            ligne.setFacture(this);
            ligne.calculateTotalLigne();
            totalHt = totalHt.add(ligne.getTotalLigne());
        }

        this.montantHT = money(totalHt);
        this.montantTVA = money(this.montantHT.multiply(this.tauxTVA));
        this.montantTTC = money(this.montantHT.add(this.montantTVA));

        if (this.montantPaye.compareTo(this.montantTTC) > 0) {
            throw new BusinessException("Le montant payé ne peut pas dépasser le montant TTC.");
        }

        this.resteAPayer = money(this.montantTTC.subtract(this.montantPaye));

        if (this.montantPaye.compareTo(BigDecimal.ZERO) == 0) {
            if (this.statut == null) {
                this.statut = StatutFacture.BROUILLON;
            }
            return;
        }

        this.statut = this.resteAPayer.compareTo(BigDecimal.ZERO) == 0
                ? StatutFacture.PAYEE
                : StatutFacture.PARTIELLEMENT_PAYEE;
    }

    public void appliquerPaiement(BigDecimal montant) {
        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Le montant du paiement doit être strictement positif.");
        }

        calculateMontants();

        if (montant.compareTo(this.resteAPayer) > 0) {
            throw new BusinessException("Le montant du paiement dépasse le reste à payer.");
        }

        this.montantPaye = money(this.montantPaye.add(montant));
        this.resteAPayer = money(this.montantTTC.subtract(this.montantPaye));
        this.statut = this.resteAPayer.compareTo(BigDecimal.ZERO) == 0
                ? StatutFacture.PAYEE
                : StatutFacture.PARTIELLEMENT_PAYEE;
    }

    public void setLignes(List<LigneFacture> lignes) {
        this.lignes.clear();
        if (lignes != null) {
            for (LigneFacture ligne : lignes) {
                ligne.setFacture(this);
                this.lignes.add(ligne);
            }
        }
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}