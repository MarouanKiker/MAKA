import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { DemandeConge, Employe } from '../../../core/models/hr.model';

@Component({
    selector: 'app-conges',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './conges.component.html',
    styleUrls: ['../../shared/crm-page.scss', './conges.component.scss']
})
export class CongesComponent implements OnInit {

    demandesConge: DemandeConge[] = [];
    employes: Employe[] = [];
    errorMsg = '';
    successMsg = '';

    showForm = false;
    newConge: any = {};

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadConges();
        this.loadEmployes();
    }

    loadConges(): void {
        this.hr.getDemandesConge().subscribe({
            next: (data) => this.demandesConge = data,
            error: (err) => this.errorMsg = 'Erreur chargement congés : ' + err.status
        });
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({ next: (data) => this.employes = data });
    }

    saveConge(): void {
        if (!this.newConge.employeId) { this.errorMsg = 'Sélectionnez un employé'; return; }
        this.hr.createDemandeConge(this.newConge).subscribe({
            next: (c) => {
                this.demandesConge.push(c);
                this.showForm = false;
                this.newConge = {};
                this.successMsg = 'Demande soumise !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur : ' + (err.error || err.status)
        });
    }

    approuver(id: number): void {
        this.hr.approuverDemande(id).subscribe({
            next: (updated) => {
                const d = this.demandesConge.find(c => c.id === id);
                if (d) d.etat = 'Validé';
                this.successMsg = 'Congé approuvé !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur : ' + err.status
        });
    }

    refuser(id: number): void {
        this.hr.refuserDemande(id).subscribe({
            next: (updated) => {
                const d = this.demandesConge.find(c => c.id === id);
                if (d) d.etat = 'Refusé';
                this.successMsg = 'Congé refusé.';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur : ' + err.status
        });
    }

    getStatutClass(etat: string): string {
        if (etat === 'Validé') return 'success';
        if (etat === 'Refusé') return 'danger';
        return 'warning';
    }
}
