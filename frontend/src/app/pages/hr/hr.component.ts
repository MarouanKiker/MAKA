import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../core/services/hr.service';
import { Employe, DemandeConge, FicheDePaie, Reclamation } from '../../core/models/hr.model';

type Tab = 'employes' | 'conges' | 'paie' | 'reclamations';

@Component({
    selector: 'app-hr',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './hr.component.html',
    styleUrls: ['../shared/crm-page.scss', './hr.component.scss']
})
export class HrComponent implements OnInit {

    activeTab: Tab = 'employes';

    // --- Données ---
    employes: Employe[] = [];
    demandesConge: DemandeConge[] = [];
    fichesDePaie: FicheDePaie[] = [];
    reclamations: Reclamation[] = [];

    // --- États de chargement ---
    loading = false;
    errorMsg = '';

    // --- Formulaire Employé ---
    showEmployeForm = false;
    newEmploye: Partial<Employe> = {};

    // --- Formulaire Congé ---
    showCongeForm = false;
    newConge: Partial<DemandeConge> = {};

    // --- Formulaire Réclamation ---
    showReclamationForm = false;
    newReclamation: Partial<Reclamation> = {};

    constructor(private hr: HrService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.loadEmployes();
        this.loadConges();
        this.loadFiches();
        this.loadReclamations();
    }

    loadEmployes(): void {
        this.hr.getEmployes().subscribe({
            next: (data) => this.employes = data,
            error: (err) => this.errorMsg = 'Erreur chargement employés : ' + err.status
        });
    }

    loadConges(): void {
        this.hr.getDemandesConge().subscribe({
            next: (data) => this.demandesConge = data,
            error: () => {}
        });
    }

    loadFiches(): void {
        this.hr.getFichesDePaie().subscribe({
            next: (data) => this.fichesDePaie = data,
            error: () => {}
        });
    }

    loadReclamations(): void {
        this.hr.getReclamations().subscribe({
            next: (data) => this.reclamations = data,
            error: () => {}
        });
    }

    // ========================
    // EMPLOYÉS
    // ========================
    saveEmploye(): void {
        this.hr.createEmploye(this.newEmploye).subscribe({
            next: (emp) => {
                this.employes.push(emp);
                this.showEmployeForm = false;
                this.newEmploye = {};
            },
            error: (err) => this.errorMsg = 'Erreur création : ' + err.status
        });
    }

    deleteEmploye(id: number): void {
        if (!confirm('Supprimer cet employé ?')) return;
        this.hr.deleteEmploye(id).subscribe({
            next: () => this.employes = this.employes.filter(e => e.id !== id),
            error: (err) => this.errorMsg = 'Erreur suppression : ' + err.status
        });
    }

    // ========================
    // CONGÉS
    // ========================
    saveConge(): void {
        this.hr.createDemandeConge(this.newConge).subscribe({
            next: (c) => {
                this.demandesConge.push(c);
                this.showCongeForm = false;
                this.newConge = {};
            },
            error: (err) => this.errorMsg = 'Erreur création congé : ' + err.status
        });
    }

    approuver(id: number): void {
        this.hr.approuverDemande(id).subscribe({
            next: () => {
                const d = this.demandesConge.find(c => c.id === id);
                if (d) d.statut = 'APPROUVEE';
            }
        });
    }

    refuser(id: number): void {
        this.hr.refuserDemande(id).subscribe({
            next: () => {
                const d = this.demandesConge.find(c => c.id === id);
                if (d) d.statut = 'REFUSEE';
            }
        });
    }

    // ========================
    // RÉCLAMATIONS
    // ========================
    saveReclamation(): void {
        this.hr.createReclamation(this.newReclamation).subscribe({
            next: (r) => {
                this.reclamations.push(r);
                this.showReclamationForm = false;
                this.newReclamation = {};
            },
            error: (err) => this.errorMsg = 'Erreur création réclamation : ' + err.status
        });
    }

    traiter(id: number): void {
        this.hr.traiterReclamation(id).subscribe({
            next: () => {
                const r = this.reclamations.find(r => r.id === id);
                if (r) r.statut = 'TRAITEE';
            }
        });
    }

    setTab(tab: Tab): void {
        this.activeTab = tab;
        this.errorMsg = '';
    }

    getStatutClass(statut: string): string {
        const s = statut?.toLowerCase();
        if (s === 'approuvee' || s === 'traitee') return 'success';
        if (s === 'refusee') return 'danger';
        return 'warning';
    }

    getMoisLabel(m: number): string {
        const mois = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
        return mois[m - 1] || m.toString();
    }
}
