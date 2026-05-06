package com.maka.finance.invoicing_service.entities;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rapports_financiers")
@Getter
@Setter
@NoArgsConstructor
public class RapportFinancier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String type; // BILAN, CASHFLOW

    @Column(nullable = false)
    private OffsetDateTime dateGeneration;

    @Column(columnDefinition = "TEXT")
    private String donneesJson;

    @PrePersist
    void onCreate() {
        this.dateGeneration = OffsetDateTime.now();
    }
}
