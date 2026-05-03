package com.maka.hr.controllers;

import com.maka.hr.models.Departement;
import com.maka.hr.repositories.DepartementRepository;
import com.maka.hr.repositories.EmployeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/hr/departements")
public class DepartementController {

    @Autowired private DepartementRepository departementRepository;
    @Autowired private EmployeRepository employeRepository;

    // Liste de tous les départements avec le nombre d'employés
    @GetMapping
    public List<Map<String, Object>> getAll() {
        List<Departement> depts = departementRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Departement d : depts) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", d.getId());
            m.put("nom", d.getNom());
            m.put("nbEmployes", employeRepository.countByDepartement(d.getNom()));
            result.add(m);
        }
        return result;
    }

    // Créer un département
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Departement dept) {
        if (departementRepository.existsByNom(dept.getNom())) {
            return ResponseEntity.badRequest().body("Département déjà existant");
        }
        return ResponseEntity.ok(departementRepository.save(dept));
    }

    // Supprimer un département
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!departementRepository.existsById(id)) return ResponseEntity.notFound().build();
        departementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
