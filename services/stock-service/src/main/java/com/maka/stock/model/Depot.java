package com.maka.stock.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Depot {
    private Long id;
    private String nom;
    private String adresse;
    private int capaciteMax;
    private LocalDateTime dateCreation;
}
