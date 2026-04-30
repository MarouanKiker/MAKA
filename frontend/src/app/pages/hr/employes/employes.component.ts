import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { Employe } from '../../../core/models/hr.model';

@Component({
    selector: 'app-employes',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './employes.component.html',
    styleUrls: ['../../shared/crm-page.scss']
})
export class EmployesComponent implements OnInit {

    employes: Employe[] = [];
    searchTerm = '';
    errorMsg = '';

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadEmployes();
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({
            next: (data) => this.employes = data,
            error: (err) => this.errorMsg = 'Erreur chargement employés : ' + err.status
        });
    }

    get filteredEmployes(): Employe[] {
        if (!this.searchTerm) return this.employes;
        const term = this.searchTerm.toLowerCase();
        return this.employes.filter(e => 
            e.nom.toLowerCase().includes(term) || 
            e.email.toLowerCase().includes(term) ||
            e.id.toString().includes(term)
        );
    }

    exportExcel(): void {
        // Création du contenu CSV
        let csvContent = "ID;Nom Complet;Email;Date Embauche;Statut\n";
        
        this.filteredEmployes.forEach(emp => {
            const dateStr = emp.dateEmbauche ? new Date(emp.dateEmbauche).toLocaleDateString('fr-FR') : '';
            csvContent += `${emp.id};${emp.nom};${emp.email};${dateStr};Actif\n`;
        });

        // Téléchargement du fichier
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF pour forcer l'UTF-8 avec BOM (Excel le lit mieux)
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "liste_employes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
