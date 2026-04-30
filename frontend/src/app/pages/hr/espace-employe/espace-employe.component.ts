import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employe, Contrat, DemandeConge, FicheDePaie, Reclamation } from '../../../core/models/hr.model';

@Component({
    selector: 'app-espace-employe',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './espace-employe.component.html',
    styleUrls: ['../../shared/crm-page.scss']
})
export class EspaceEmployeComponent implements OnInit {

    user: any;
    monProfil: Employe | null = null;

    mesContrats: Contrat[] = [];
    mesConges: DemandeConge[] = [];
    mesFiches: FicheDePaie[] = [];
    mesReclamations: Reclamation[] = [];

    errorMsg = '';
    successMsg = '';

    // Modals
    showCongeForm = false;
    showReclamationForm = false;

    // Forms
    newConge: Partial<DemandeConge> = {};
    newReclamation: Partial<Reclamation> = {};

    activeTab = 'conges';

    constructor(
        private hr: HrService,
        private auth: AuthService
    ) {}

    ngOnInit(): void {
        this.user = this.auth.getUser();
        if (this.user && this.user.email) {
            this.loadMonProfil(this.user.email);
        } else {
            this.errorMsg = 'Impossible de charger vos informations utilisateur.';
        }
    }

    loadMonProfil(email: string): void {
        this.hr.getEmployeByEmail(email).subscribe({
            next: (emp) => {
                this.monProfil = emp;
                this.loadMyData();
            },
            error: (err) => {
                if (err.status === 404) {
                    this.errorMsg = "Votre compte n'est pas encore lié à un profil employé RH.";
                } else {
                    this.errorMsg = 'Erreur lors du chargement de votre profil RH.';
                }
            }
        });
    }

    loadMyData(): void {
        if (!this.monProfil) return;
        const id = this.monProfil.id;

        this.hr.getMesContrats(id).subscribe({ next: (data) => this.mesContrats = data });
        this.hr.getMesConges(id).subscribe({ next: (data) => this.mesConges = data });
        this.hr.getMesFiches(id).subscribe({ next: (data) => this.mesFiches = data });
        this.hr.getMesReclamations(id).subscribe({ next: (data) => this.mesReclamations = data });
    }

    setTab(tab: string): void {
        this.activeTab = tab;
    }

    // --- Actions ---

    soumettreConge(): void {
        if (!this.monProfil) return;
        this.newConge.employeId = this.monProfil.id;

        this.hr.createDemandeConge(this.newConge).subscribe({
            next: (c) => {
                this.mesConges.unshift(c); // Add to top
                this.showCongeForm = false;
                this.newConge = {};
                this.showMessage('Demande de congé soumise avec succès !');
            },
            error: (err) => this.errorMsg = 'Erreur lors de la soumission du congé.'
        });
    }

    soumettreReclamation(): void {
        if (!this.monProfil) return;
        this.newReclamation.employeId = this.monProfil.id;

        this.hr.createReclamation(this.monProfil.id, this.newReclamation).subscribe({
            next: (r) => {
                this.mesReclamations.unshift(r);
                this.showReclamationForm = false;
                this.newReclamation = {};
                this.showMessage('Réclamation envoyée !');
            },
            error: (err) => this.errorMsg = 'Erreur lors de l\'envoi de la réclamation.'
        });
    }

    showMessage(msg: string): void {
        this.successMsg = msg;
        setTimeout(() => this.successMsg = '', 4000);
    }

    // --- Helpers ---

    getStatutClass(statut: string): string {
        if (statut === 'Validé' || statut === 'Résolu') return 'success';
        if (statut === 'Refusé') return 'danger';
        return 'warning'; // EnAttente, Ouvert
    }

    getMoisLabel(m: number): string {
        const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        return mois[m - 1] || m.toString();
    }
}
