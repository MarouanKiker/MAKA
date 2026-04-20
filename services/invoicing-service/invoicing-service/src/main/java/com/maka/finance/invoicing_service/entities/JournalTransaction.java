package com.maka.finance.invoicing_service.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "journal_transactions")
@Getter
@Setter
@NoArgsConstructor
public class JournalTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_ecriture", nullable = false)
    private OffsetDateTime dateEcriture;

    @Column(name = "compte_debit", nullable = false, length = 20)
    private String compteDebit;

    @Column(name = "compte_credit", nullable = false, length = 20)
    private String compteCredit;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal debit;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal credit;

    @Column(nullable = false, length = 30)
    private String referenceType;

    @Column(nullable = false)
    private Long referenceId;

    @Column(length = 500)
    private String description;

    @PrePersist
    void onCreate() {
        if (this.dateEcriture == null) {
            this.dateEcriture = OffsetDateTime.now();
        }
    }
}
