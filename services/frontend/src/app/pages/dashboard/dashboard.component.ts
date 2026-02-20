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
            { letter: 'CO', label: 'Comptes', value: this.crm.accounts.length, bg: 'rgba(74,158,255,.12)', color: '#4a9eff', percent: (this.crm.accounts.length / max) * 100 },
            { letter: 'CT', label: 'Contacts', value: this.crm.contacts.length, bg: 'rgba(54,197,184,.12)', color: '#36c5b8', percent: (this.crm.contacts.length / max) * 100 },
            { letter: 'LD', label: 'Leads', value: this.crm.leads.length, bg: 'rgba(245,199,72,.12)', color: '#f5c748', percent: (this.crm.leads.length / max) * 100 },
            { letter: 'OP', label: 'Opportunites', value: this.crm.opportunities.length, bg: 'rgba(68,212,146,.12)', color: '#44d492', percent: (this.crm.opportunities.length / max) * 100 },
            { letter: 'TA', label: 'Taches', value: this.crm.tasks.length, bg: 'rgba(147,112,255,.12)', color: '#9370ff', percent: (this.crm.tasks.length / max) * 100 },
            { letter: 'TK', label: 'Tickets', value: this.crm.tickets.length, bg: 'rgba(240,108,98,.12)', color: '#f06c62', percent: (this.crm.tickets.length / max) * 100 },
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
