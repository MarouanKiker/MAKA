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
    successMsg = '';

    // Formulaire creation
    showForm = false;
    newEmploye: Partial<Employe> = {
        nom: '',
        email: '',
        dateEmbauche: new Date().toISOString().split('T')[0]
    };

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

    saveEmploye(): void {
        if (!this.newEmploye.nom || !this.newEmploye.email) {
            this.errorMsg = 'Veuillez remplir le nom et l\'email.';
            return;
        }

        this.hr.createEmploye(this.newEmploye).subscribe({
            next: (emp) => {
                this.successMsg = 'Employé créé avec succès !';
                this.loadEmployes();
                this.showForm = false;
                this.newEmploye = {
                    nom: '',
                    email: '',
                    dateEmbauche: new Date().toISOString().split('T')[0]
                };
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur lors de la création de l\'employé.'
        });
    }

    deleteEmploye(id: number): void {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ? Cela supprimera aussi ses contrats et fiches de paie.')) return;
        
        this.hr.deleteEmploye(id).subscribe({
            next: () => {
                this.successMsg = 'Employé supprimé.';
                this.loadEmployes();
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: () => this.errorMsg = 'Erreur lors de la suppression.'
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
