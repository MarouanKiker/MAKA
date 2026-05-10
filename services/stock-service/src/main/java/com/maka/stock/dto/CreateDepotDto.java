package com.maka.stock.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateDepotDto {

    @NotBlank(message = "Le nom du dépôt est obligatoire")
    @Size(max = 150, message = "Le nom ne doit pas dépasser 150 caractères")
    private String nom;

    private String adresse;

    @Min(value = 0, message = "La capacité maximale doit être >= 0")
    private int capaciteMax;
}
