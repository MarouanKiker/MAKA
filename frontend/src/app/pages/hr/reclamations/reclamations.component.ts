import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { Reclamation, Employe } from '../../../core/models/hr.model';

@Component({
    selector: 'app-reclamations',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './reclamations.component.html',
    styleUrls: ['../../shared/crm-page.scss']
})
export class ReclamationsComponent implements OnInit {

    reclamations: Reclamation[] = [];
    employes: Employe[] = [];
    errorMsg = '';
    successMsg = '';

    showForm = false;
    showReponse = false;
    selectedReclamationId: number | null = null;
    reponseText = '';
    newReclamation: any = {};

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadReclamations();
        this.loadEmployes();
    }

    loadReclamations(): void {
        this.hr.getReclamations().subscribe({
            next: (data) => this.reclamations = data,
            error: (err) => this.errorMsg = 'Erreur chargement réclamations : ' + err.status
        });
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({ next: (data) => this.employes = data });
    }

    saveReclamation(): void {
        if (!this.newReclamation.employeId) { this.errorMsg = 'Sélectionnez un employé'; return; }
        this.hr.createReclamation(this.newReclamation.employeId, this.newReclamation).subscribe({
            next: (r) => {
                this.reclamations.push(r);
                this.showForm = false;
                this.newReclamation = {};
                this.successMsg = 'Réclamation soumise !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur : ' + (err.error || err.status)
        });
    }

    openReponse(id: number): void {
        this.selectedReclamationId = id;
        this.reponseText = '';
        this.showReponse = true;
    }

    traiter(): void {
        if (!this.selectedReclamationId || !this.reponseText) return;
        this.hr.traiterReclamation(this.selectedReclamationId, this.reponseText).subscribe({
            next: () => {
                const r = this.reclamations.find(r => r.id === this.selectedReclamationId);
                if (r) {
                    r.statut = 'Résolu';
                    r.reponseRH = this.reponseText;
                }
                this.showReponse = false;
                this.successMsg = 'Réclamation traitée !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => this.errorMsg = 'Erreur : ' + err.status
        });
    }

    getStatutClass(statut: string): string {
        if (statut === 'Résolu') return 'success';
        return 'warning';
    }
}
