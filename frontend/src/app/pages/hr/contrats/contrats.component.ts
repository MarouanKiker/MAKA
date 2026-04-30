import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { Contrat, Employe } from '../../../core/models/hr.model';

@Component({
    selector: 'app-contrats',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './contrats.component.html',
    styleUrls: ['../../shared/crm-page.scss']
})
export class ContratsComponent implements OnInit {

    contrats: Contrat[] = [];
    employes: Employe[] = [];
    errorMsg = '';
    successMsg = '';

    showForm = false;
    newContrat: any = {};

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadContrats();
        this.loadEmployes();
    }

    loadContrats(): void {
        this.hr.getContrats().subscribe({
            next: (data) => this.contrats = data,
            error: (err) => this.errorMsg = 'Erreur chargement contrats : ' + err.status
        });
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({
            next: (data) => this.employes = data
        });
    }

    saveContrat(): void {
        const employeId = this.newContrat.employeId;
        if (!employeId) { this.errorMsg = 'Sélectionnez un employé'; return; }

        this.hr.createContrat(employeId, this.newContrat).subscribe({
            next: (c) => {
                this.contrats.push(c);
                this.showForm = false;
                this.newContrat = {};
                this.successMsg = 'Contrat créé avec succès !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur création contrat : ' + (err.error || err.status)
        });
    }

    deleteContrat(id: number): void {
        if (!confirm('Supprimer ce contrat ?')) return;
        this.hr.deleteContrat(id).subscribe({
            next: () => this.contrats = this.contrats.filter(c => c.id !== id),
            error: (err) => this.errorMsg = 'Erreur suppression : ' + err.status
        });
    }

    getTypeClass(type: string): string {
        if (type === 'CDI') return 'success';
        if (type === 'CDD') return 'warning';
        return 'nouvelle';
    }
}
