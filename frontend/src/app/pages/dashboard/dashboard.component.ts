import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CrmService } from '../../core/services/crm.service';
import { Lead, Opportunity } from '../../core/models/crm.model';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, DatePipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

    userName = '';
    today = '';

    stats: any[] = [];
    pipeline: any[] = [];

    leads: Lead[] = [];
    opportunities: Opportunity[] = [];
    nbAccounts = 0;
    nbContacts = 0;

    constructor(public auth: AuthService, public crm: CrmService, private router: Router) {
        let user = this.auth.getUser();
        if (user) {
            this.userName = user.prenom;
        }

        this.today = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    ngOnInit(): void {
        forkJoin({
            leads: this.crm.getLeads().pipe(catchError(() => of([]))),
            opps:  this.crm.getOpportunities().pipe(catchError(() => of([]))),
            accounts: this.crm.getAccounts(undefined, 1, 1).pipe(catchError(() => of({ total: 0, data: [], page: 1, pageSize: 1, totalPages: 1 }))),
            contacts: this.crm.getContacts().pipe(catchError(() => of([])))
        }).subscribe({
            next: (data) => {
                this.leads        = data.leads as Lead[];
                this.opportunities = data.opps as Opportunity[];
                this.nbAccounts   = (data.accounts as any).total ?? 0;
                this.nbContacts   = (data.contacts as any[]).length ?? 0;

                this.buildStats();
                this.buildPipeline();
            },
            error: (err) => console.error('Erreur forkJoin dashboard', err)
        });
    }

    buildStats(): void {
        let max = Math.max(
            this.nbAccounts,
            this.nbContacts,
            this.leads.length,
            this.opportunities.length,
            1
        );

        this.stats = [
            { icon: 'fa-solid fa-building', label: 'Comptes', value: this.nbAccounts, bg: 'rgba(96,165,250,.12)', color: '#60a5fa', percent: (this.nbAccounts / max) * 100 },
            { icon: 'fa-solid fa-address-book', label: 'Contacts', value: this.nbContacts, bg: 'rgba(167,139,250,.12)', color: '#a78bfa', percent: (this.nbContacts / max) * 100 },
            { icon: 'fa-solid fa-bullseye', label: 'Leads', value: this.leads.length, bg: 'rgba(251,191,36,.12)', color: '#fbbf24', percent: (this.leads.length / max) * 100 },
            { icon: 'fa-solid fa-arrow-trend-up', label: 'Opportunites', value: this.opportunities.length, bg: 'rgba(52,211,153,.12)', color: '#34d399', percent: (this.opportunities.length / max) * 100 },
        ];
    }

    buildPipeline(): void {
        let total = Math.max(this.opportunities.length, 1);

        let nbNouvelle = 0;
        let nbEnCours = 0;
        let nbGagnee = 0;
        let nbPerdue = 0;

        for (let i = 0; i < this.opportunities.length; i++) {
            let opp = this.opportunities[i];
            if (opp.statut === 0) nbNouvelle++;
            if (opp.statut === 1) nbEnCours++;
            if (opp.statut === 2) nbGagnee++;
            if (opp.statut === 3) nbPerdue++;
        }

        this.pipeline = [
            { label: 'Nouvelle', count: nbNouvelle, color: '#4a9eff', percent: (nbNouvelle / total) * 100 },
            { label: 'En cours', count: nbEnCours, color: '#f5c748', percent: (nbEnCours / total) * 100 },
            { label: 'Gagnee', count: nbGagnee, color: '#44d492', percent: (nbGagnee / total) * 100 },
            { label: 'Perdue', count: nbPerdue, color: '#f06c62', percent: (nbPerdue / total) * 100 },
        ];
    }

    goTo(path: string): void {
        this.router.navigate([path]);
    }
}
