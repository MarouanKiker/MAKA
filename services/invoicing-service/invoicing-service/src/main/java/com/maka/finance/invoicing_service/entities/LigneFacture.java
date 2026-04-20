package com.maka.finance.invoicing_service.entities;

import com.maka.finance.invoicing_service.exceptions.BusinessException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lignes_facture")
@Getter
@Setter
@NoArgsConstructor
public class LigneFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    @Column(nullable = false, length = 255)
    private String produit;

    @Column(nullable = false)
    private Integer quantite;

    @Column(name = "prix_unitaire", nullable = false, precision = 19, scale = 2)
    private BigDecimal prixUnitaire;

    @Column(name = "total_ligne", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalLigne = BigDecimal.ZERO;

    public void calculateTotalLigne() {
        if (quantite == null || quantite <= 0) {
            throw new BusinessException("La quantité doit être strictement positive.");
        }
        if (prixUnitaire == null || prixUnitaire.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Le prix unitaire doit être strictement positif.");
        }

        this.totalLigne = prixUnitaire
                .multiply(BigDecimal.valueOf(quantite))
                .setScale(2, RoundingMode.HALF_UP);
    }
}