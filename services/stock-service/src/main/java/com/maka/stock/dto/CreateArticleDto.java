package com.maka.stock.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateArticleDto {

    @NotBlank(message = "La référence est obligatoire")
    @Size(max = 60, message = "La référence ne doit pas dépasser 60 caractères")
    private String reference;

    @NotBlank(message = "La désignation est obligatoire")
    @Size(max = 200, message = "La désignation ne doit pas dépasser 200 caractères")
    private String designation;

    private String description;

    @Pattern(regexp = "PIECE|KG|LITRE|M|M2", message = "Unité invalide. Valeurs: PIECE, KG, LITRE, M, M2")
    private String unite;  // Défaut = PIECE si null

    @NotNull(message = "Le prix d'achat est obligatoire")
    @DecimalMin(value = "0.0", inclusive = true, message = "Le prix d'achat doit être >= 0")
    private BigDecimal prixAchat;

    @NotNull(message = "Le prix de vente est obligatoire")
    @DecimalMin(value = "0.0", inclusive = true, message = "Le prix de vente doit être >= 0")
    private BigDecimal prixVente;

    @Min(value = 0, message = "Le seuil minimum d'alerte doit être >= 0")
    private int seuilMinAlerte;

    private String emplacementRayon;

    private Long categorieId;
}
