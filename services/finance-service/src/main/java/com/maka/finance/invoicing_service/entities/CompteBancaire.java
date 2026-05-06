package com.maka.finance.invoicing_service.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "comptes_bancaires")
@Getter
@Setter
@NoArgsConstructor
public class CompteBancaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nomBanque;

    @Column(unique = true, nullable = false, length = 34)
    private String iban;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal soldeActuel = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String devise = "MAD";

    public void credit(BigDecimal montant) {
        this.soldeActuel = this.soldeActuel.add(montant);
    }

    public void debit(BigDecimal montant) {
        this.soldeActuel = this.soldeActuel.subtract(montant);
    }
}
