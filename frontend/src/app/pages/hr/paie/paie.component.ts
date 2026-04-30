import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { FicheDePaie, Employe } from '../../../core/models/hr.model';

@Component({
    selector: 'app-paie',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './paie.component.html',
    styleUrls: ['../../shared/crm-page.scss', './paie.component.scss']
})
export class PaieComponent implements OnInit {

    fichesDePaie: FicheDePaie[] = [];
    employes: Employe[] = [];
    errorMsg = '';
    successMsg = '';

    showForm = false;
    genForm: any = { mois: new Date().getMonth() + 1, annee: new Date().getFullYear() };

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadFiches();
        this.loadEmployes();
    }

    loadFiches(): void {
        this.hr.getFichesDePaie().subscribe({
            next: (data) => this.fichesDePaie = data,
            error: (err) => this.errorMsg = 'Erreur chargement fiches : ' + err.status
        });
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({ next: (data) => this.employes = data });
    }

    genererFiche(): void {
        if (!this.genForm.employeId) { this.errorMsg = 'Sélectionnez un employé'; return; }
        this.errorMsg = '';

        this.hr.genererFicheDePaie(this.genForm.employeId, this.genForm.mois, this.genForm.annee).subscribe({
            next: (fiche) => {
                this.fichesDePaie.push(fiche);
                this.showForm = false;
                this.successMsg = 'Fiche de paie générée !';
                setTimeout(() => this.successMsg = '', 3000);
            },
            error: (err) => {
                const msg = typeof err.error === 'string' ? err.error : err.status;
                this.errorMsg = 'Erreur : ' + msg;
            }
        });
    }

    getMoisLabel(m: number): string {
        const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        return mois[m - 1] || m.toString();
    }
}
