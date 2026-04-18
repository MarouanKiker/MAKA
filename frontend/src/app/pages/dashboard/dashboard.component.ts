import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CrmService } from '../../core/services/crm.service';
import { Lead, Opportunity } from '../../core/models/crm.model';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
            leads: this.crm.getLeads(),
            opps: this.crm.getOpportunities()
        }).subscribe({
            next: (data) => {
                this.leads = data.leads;
                this.opportunities = data.opps;
                
                this.buildStats();
                this.buildPipeline();
            },
            error: (err) => console.error('Erreur forcJoin dashboard', err)
        });
    }

    buildStats(): void {
        let max = Math.max(
            this.crm.accounts.length,
            this.crm.contacts.length,
            this.leads.length,
            this.opportunities.length,
            this.crm.tasks.length,
            this.crm.tickets.length,
            1
        );

        this.stats = [
            { icon: 'fa-solid fa-building', label: 'Comptes', value: this.crm.accounts.length, bg: 'rgba(96,165,250,.12)', color: '#60a5fa', percent: (this.crm.accounts.length / max) * 100 },
            { icon: 'fa-solid fa-address-book', label: 'Contacts', value: this.crm.contacts.length, bg: 'rgba(167,139,250,.12)', color: '#a78bfa', percent: (this.crm.contacts.length / max) * 100 },
            { icon: 'fa-solid fa-bullseye', label: 'Leads', value: this.leads.length, bg: 'rgba(251,191,36,.12)', color: '#fbbf24', percent: (this.leads.length / max) * 100 },
            { icon: 'fa-solid fa-arrow-trend-up', label: 'Opportunites', value: this.opportunities.length, bg: 'rgba(52,211,153,.12)', color: '#34d399', percent: (this.opportunities.length / max) * 100 },
            { icon: 'fa-solid fa-list-check', label: 'Taches', value: this.crm.tasks.length, bg: 'rgba(251,146,60,.12)', color: '#fb923c', percent: (this.crm.tasks.length / max) * 100 },
            { icon: 'fa-solid fa-ticket', label: 'Tickets', value: this.crm.tickets.length, bg: 'rgba(248,113,113,.12)', color: '#f87171', percent: (this.crm.tickets.length / max) * 100 },
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
