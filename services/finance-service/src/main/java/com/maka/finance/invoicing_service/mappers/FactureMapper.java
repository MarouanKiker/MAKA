package com.maka.finance.invoicing_service.mappers;

import com.maka.finance.invoicing_service.dto.FactureRequest;
import com.maka.finance.invoicing_service.dto.FactureResponse;
import com.maka.finance.invoicing_service.dto.LigneFactureRequest;
import com.maka.finance.invoicing_service.dto.LigneFactureResponse;
import com.maka.finance.invoicing_service.entities.Facture;
import com.maka.finance.invoicing_service.entities.LigneFacture;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class FactureMapper {

    public Facture toEntity(FactureRequest request) {
        Facture facture = new Facture();
        facture.setNumero(request.numero());
        facture.setClientNom(request.clientNom());
        facture.setDateEcheance(request.dateEcheance());
        facture.setTauxTVA(request.tauxTVA() == null ? new BigDecimal("0.20") : request.tauxTVA());
        facture.setTaxe(request.taxe() == null ? BigDecimal.ZERO : request.taxe());
        
        List<LigneFacture> lignes = mapLignesToEntities(request.lignes());
        lignes.forEach(l -> l.setFacture(facture));
        facture.setLignes(lignes);
        
        return facture;
    }

    public void updateEntity(Facture facture, FactureRequest request) {
        facture.setNumero(request.numero());
        facture.setClientNom(request.clientNom());
        facture.setDateEcheance(request.dateEcheance());
        facture.setTauxTVA(request.tauxTVA() == null ? facture.getTauxTVA() : request.tauxTVA());
        
        // Remove old lines if needed, add new lines
        facture.getLignes().clear();
        List<LigneFacture> nouvellesLignes = mapLignesToEntities(request.lignes());
        nouvellesLignes.forEach(l -> l.setFacture(facture));
        facture.getLignes().addAll(nouvellesLignes);
    }

    public FactureResponse toResponse(Facture facture) {
        return new FactureResponse(
                facture.getId(),
                facture.getNumero(),
                facture.getClientNom(),
                facture.getDateEcheance(),
                facture.getTauxTVA(),
                facture.getMontantHT(),
                facture.getMontantTVA(),
                facture.getMontantTTC(),
                facture.getMontantPaye(),
                facture.getResteAPayer(),
                facture.getStatut(),
                facture.getDateCreation(),
                facture.getDateMiseAJour(),
                mapLignesToResponses(facture.getLignes())
        );
    }

    private List<LigneFacture> mapLignesToEntities(List<LigneFactureRequest> lignes) {
        List<LigneFacture> entities = new ArrayList<>();
        for (LigneFactureRequest ligne : lignes) {
            LigneFacture entity = new LigneFacture();
            entity.setProduit(ligne.produit());
            entity.setQuantite(ligne.quantite());
            entity.setPrixUnitaire(ligne.prixUnitaire());
            entities.add(entity);
        }
        return entities;
    }

    private List<LigneFactureResponse> mapLignesToResponses(List<LigneFacture> lignes) {
        List<LigneFactureResponse> responses = new ArrayList<>();
        for (LigneFacture ligne : lignes) {
            responses.add(new LigneFactureResponse(
                    ligne.getId(),
                    ligne.getProduit(),
                    ligne.getQuantite(),
                    ligne.getPrixUnitaire(),
                    ligne.getTotalLigne()
            ));
        }
        return responses;
    }
}
