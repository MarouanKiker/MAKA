package com.maka.finance.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Controller du service Finance - API implementee en memoire pour la Demo
 */
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final List<Map<String, Object>> factures = new ArrayList<>();
    private final List<Map<String, Object>> paiements = new ArrayList<>();
    private final List<Map<String, Object>> comptesBancaires = new ArrayList<>();
    
    private final AtomicInteger factId = new AtomicInteger(100);
    private final AtomicInteger paieId = new AtomicInteger(100);
    private final AtomicInteger compteId = new AtomicInteger(100);

    public FinanceController() {
        // Initialiser quelques donnees de demo pour la page Finance
        Map<String, Object> f1 = new HashMap<>();
        f1.put("id", 1);
        f1.put("numero", "FAC-2026-001");
        f1.put("montant", 15400.0);
        f1.put("tauxTVA", 20);
        f1.put("statut", "PAYEE");
        factures.add(f1);

        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", 1);
        c1.put("iban", "MA64 0111 2222 3333 4444 5555 66");
        c1.put("banque", "BMCE Bank");
        comptesBancaires.add(c1);
        
        Map<String, Object> p1 = new HashMap<>();
        p1.put("id", 1);
        p1.put("montant", 15400.0);
        p1.put("methode", "VIREMENT");
        p1.put("reference", "VIR-7890123");
        p1.put("factureId", 1);
        paiements.add(p1);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "finance-service", "version", "1.0.0");
    }

    // --- FACTURES ---
    @GetMapping("/factures")
    public List<Map<String, Object>> getFactures() { return factures; }

    @PostMapping("/factures")
    public Map<String, Object> addFacture(@RequestBody Map<String, Object> facture) {
        facture.put("id", factId.getAndIncrement());
        facture.putIfAbsent("statut", "IMPAYEE");
        factures.add(facture);
        return facture;
    }

    @PutMapping("/factures/{id}")
    public Map<String, Object> updateFacture(@PathVariable int id, @RequestBody Map<String, Object> fData) {
        for(Map<String, Object> f : factures) {
            String strId = String.valueOf(f.get("id"));
            if(strId.equals(String.valueOf(id))) {
                f.putAll(fData);
                return f;
            }
        }
        return fData;
    }

    @DeleteMapping("/factures/{id}")
    public void deleteFacture(@PathVariable int id) {
        factures.removeIf(f -> String.valueOf(f.get("id")).equals(String.valueOf(id)));
    }

    // --- PAIEMENTS ---
    @GetMapping("/paiements")
    public List<Map<String, Object>> getPaiements() { return paiements; }

    @PostMapping("/paiements")
    public Map<String, Object> addPaiement(@RequestBody Map<String, Object> p) {
        p.put("id", paieId.getAndIncrement());
        paiements.add(p);
        // Si un paiement est lie a une facture, on devrait la passer a "PAYEE" mais c'est gerable front
        return p;
    }

    @DeleteMapping("/paiements/{id}")
    public void deletePaiement(@PathVariable int id) {
        paiements.removeIf(p -> String.valueOf(p.get("id")).equals(String.valueOf(id)));
    }

    // --- COMPTES BANCAIRES ---
    @GetMapping("/comptes-bancaires")
    public List<Map<String, Object>> getComptes() { return comptesBancaires; }

    @PostMapping("/comptes-bancaires")
    public Map<String, Object> addCompte(@RequestBody Map<String, Object> c) {
        c.put("id", compteId.getAndIncrement());
        comptesBancaires.add(c);
        return c;
    }

    @DeleteMapping("/comptes-bancaires/{id}")
    public void deleteCompte(@PathVariable int id) {
        comptesBancaires.removeIf(c -> String.valueOf(c.get("id")).equals(String.valueOf(id)));
    }

    // --- JOURNAL ---
    @GetMapping("/journal")
    public List<Map<String, Object>> getJournal() {
        return Collections.emptyList(); // historique simule
    }

    @GetMapping("/journal/stats")
    public Map<String, Object> getStats() {
        return Map.of("caMensuel", 245000, "croissance", 12.5, "alertes", 3);
    }
}
