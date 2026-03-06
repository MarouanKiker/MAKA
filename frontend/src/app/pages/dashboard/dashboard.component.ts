import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CrmService } from '../../core/services/crm.service';

// composant du tableau de bord (page d'accueil apres connexion)
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

    // nom de l'utilisateur connecte
    userName = '';
    // date d'aujourd'hui formatee
    today = '';

    // donnees pour les cartes de statistiques
    stats: any[] = [];

    // donnees pour le graphique du pipeline
    pipeline: any[] = [];

    constructor(private auth: AuthService, public crm: CrmService) {
        // recuperer le prenom de l'utilisateur
        let user = this.auth.getUser();
        if (user) {
            this.userName = user.prenom;
        }

        // formater la date d'aujourd'hui
        this.today = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        // construire les stats et le pipeline
        this.buildStats();
        this.buildPipeline();
    }

    // construire les donnees pour les cartes de stats
    buildStats(): void {
        // trouver le maximum pour calculer les pourcentages
        let max = Math.max(
            this.crm.accounts.length,
            this.crm.contacts.length,
            this.crm.leads.length,
            this.crm.opportunities.length,
            this.crm.tasks.length,
            this.crm.tickets.length,
            1
        );

        this.stats = [
            { icon: 'fa-solid fa-building', label: 'Comptes', value: this.crm.accounts.length, bg: 'rgba(96,165,250,.12)', color: '#60a5fa', percent: (this.crm.accounts.length / max) * 100 },
            { icon: 'fa-solid fa-address-book', label: 'Contacts', value: this.crm.contacts.length, bg: 'rgba(167,139,250,.12)', color: '#a78bfa', percent: (this.crm.contacts.length / max) * 100 },
            { icon: 'fa-solid fa-bullseye', label: 'Leads', value: this.crm.leads.length, bg: 'rgba(251,191,36,.12)', color: '#fbbf24', percent: (this.crm.leads.length / max) * 100 },
            { icon: 'fa-solid fa-arrow-trend-up', label: 'Opportunites', value: this.crm.opportunities.length, bg: 'rgba(52,211,153,.12)', color: '#34d399', percent: (this.crm.opportunities.length / max) * 100 },
            { icon: 'fa-solid fa-list-check', label: 'Taches', value: this.crm.tasks.length, bg: 'rgba(251,146,60,.12)', color: '#fb923c', percent: (this.crm.tasks.length / max) * 100 },
            { icon: 'fa-solid fa-ticket', label: 'Tickets', value: this.crm.tickets.length, bg: 'rgba(248,113,113,.12)', color: '#f87171', percent: (this.crm.tickets.length / max) * 100 },
        ];
    }

    // construire les donnees pour le pipeline d'opportunites
    buildPipeline(): void {
        let total = Math.max(this.crm.opportunities.length, 1);

        // compter les opportunites de chaque statut
        let nbNouvelle = 0;
        let nbEnCours = 0;
        let nbGagnee = 0;
        let nbPerdue = 0;

        for (let i = 0; i < this.crm.opportunities.length; i++) {
            let opp = this.crm.opportunities[i];
            if (opp.statut === 'NOUVELLE') nbNouvelle++;
            if (opp.statut === 'EN_COURS') nbEnCours++;
            if (opp.statut === 'GAGNEE') nbGagnee++;
            if (opp.statut === 'PERDUE') nbPerdue++;
        }

        this.pipeline = [
            { label: 'Nouvelle', count: nbNouvelle, color: '#4a9eff', percent: (nbNouvelle / total) * 100 },
            { label: 'En cours', count: nbEnCours, color: '#f5c748', percent: (nbEnCours / total) * 100 },
            { label: 'Gagnee', count: nbGagnee, color: '#44d492', percent: (nbGagnee / total) * 100 },
            { label: 'Perdue', count: nbPerdue, color: '#f06c62', percent: (nbPerdue / total) * 100 },
        ];
    }
}
