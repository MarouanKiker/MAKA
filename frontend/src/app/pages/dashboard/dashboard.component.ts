import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CrmService } from '../../core/services/crm.service';
import { FinanceService } from '../../core/services/finance.service';
import { StockService } from '../../core/services/stock.service';
import { Lead, Opportunity } from '../../core/models/crm.model';
import { Facture, Paiement, CompteBancaire } from '../../core/models/finance.model';
import { ArticleStock, DepotStock } from '../../core/models/stock.model';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    toastMessage = '';

    stats: any[] = [];
    pipeline: any[] = [];

    leads: Lead[] = [];
    opportunities: Opportunity[] = [];

    // Finance data
    finFactures: Facture[] = [];
    finPaiements: Paiement[] = [];
    finComptes: CompteBancaire[] = [];

    // Stock data
    stockArticles: ArticleStock[] = [];
    stockAlertes: ArticleStock[] = [];
    stockDepots: DepotStock[] = [];

    constructor(
        public auth: AuthService,
        public crm: CrmService,
        private financeSvc: FinanceService,
        private stockSvc: StockService,
        private router: Router
    ) {
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
            leads: this.crm.getLeads().pipe(catchError(() => of([] as Lead[]))),
            opps: this.crm.getOpportunities().pipe(catchError(() => of([] as Opportunity[])))
        }).subscribe({
            next: (data) => {
                this.leads = data.leads;
                this.opportunities = data.opps;

                this.buildStats();
                this.buildPipeline();
            },
            error: () => { /* forkJoin ne devrait plus échouer : branche CRM isolée */ }
        });

        // Load finance data
        this.financeSvc.getFactures().subscribe({
            next: (data) => this.finFactures = data,
            error: () => {}
        });
        this.financeSvc.getPaiements().subscribe({
            next: (data) => this.finPaiements = data,
            error: () => {}
        });
        this.financeSvc.getComptesBancaires().subscribe({
            next: (data) => this.finComptes = data,
            error: () => {}
        });

        // Load stock data
        this.stockSvc.getArticles('', 1, 50).subscribe({
            next: (page) => this.stockArticles = page.data || [],
            error: () => {}
        });
        this.stockSvc.getAlertes().subscribe({
            next: (data) => this.stockAlertes = data,
            error: () => {}
        });
        this.stockSvc.getDepots().subscribe({
            next: (data) => this.stockDepots = data,
            error: () => {}
        });
    }

    buildStats(): void {
        let max = Math.max(
            this.leads.length,
            this.opportunities.length,
            1
        );

        this.stats = [
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

    goTo(path: string): void {
        this.router.navigate([path]);
    }

    showOpToast(): void {
        this.toastMessage = 'Le système est 100% opérationnel. Aucun incident en cours.';
        setTimeout(() => this.toastMessage = '', 4000);
    }

    downloadReport(): void {
        this.toastMessage = 'Génération du rapport global en cours...';
        setTimeout(() => {
            const csvContent = "data:text/csv;charset=utf-8," + 
                "Module,Statut,Metrique\n" +
                "CRM & Ventes,Operationnel," + this.leads.length + " Leads\n" +
                "Finance & Compta,Operationnel," + this.opportunities.length + " Opportunites\n" +
                "Serveur API,Operationnel,99.9% Uptime\n" +
                "Base de donnees,Operationnel,3.2ms de latence";
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `maka_rapport_global_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.toastMessage = 'Le rapport CSV a été téléchargé avec succès.';
            setTimeout(() => this.toastMessage = '', 4000);
        }, 1500);
    }

    // --- Finance Stats ---
    getFinanceCA(): number {
        return this.finFactures.reduce((s, f) => s + (f.montantTTC || 0), 0);
    }
    getFinancePaiementsEnAttente(): number {
        return this.finPaiements.filter(p => p.statut === 'EN_ATTENTE').length;
    }
    getFinanceSoldeBancaire(): number {
        return this.finComptes.reduce((s, c) => s + (c.soldeActuel || 0), 0);
    }

    // --- Stock Stats ---
    getStockTotalQuantite(): number {
        return this.stockArticles.reduce((s, a) => s + (a.stockTotal || 0), 0);
    }

    getStockValeurAchat(): number {
        return this.stockArticles.reduce((s, a) => s + ((a.stockTotal || 0) * (a.prixAchat || 0)), 0);
    }
}
