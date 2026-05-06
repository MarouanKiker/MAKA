import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Campaign, Lead, Opportunity } from '../../core/models/crm.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-campaigns',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './campaigns.component.html',
    styleUrls: ['../shared/crm-page.scss']
})
export class CampaignsComponent implements OnInit {

    showForm = false;
    nom = '';
    type = 'SOCIAL';
    budget = 0;
    dateDebut = '';
    dateFin = '';

    campaignTypes = [
        { id: 'SOCIAL', label: 'Réseaux Sociaux' },
        { id: 'EMAIL', label: 'Emailing' },
        { id: 'EVENT', label: 'Événement' },
        { id: 'SEO', label: 'SEO / Web' },
        { id: 'OTHER', label: 'Autre' }
    ];

    campaigns: Campaign[] = [];

    constructor(private crm: CrmService) { }

    ngOnInit(): void {
        this.loadCampaigns();
    }

    loadCampaigns(): void {
        forkJoin({
            campaigns: this.crm.getCampaigns(),
            leads: this.crm.getLeads(),
            opps: this.crm.getOpportunities()
        }).subscribe({
            next: (data) => {
                const now = new Date().getTime();
                
                this.campaigns = data.campaigns.map(c => {
                    const campLeads = data.leads.filter(l => l.campagneId === c.id);
                    const leadIds = campLeads.map(l => l.id);
                    const wonOpps = data.opps.filter(o => leadIds.includes(o.leadId) && o.statut === 'GAGNEE');
                    
                    const revenue = wonOpps.reduce((sum, o) => sum + o.valeur, 0);
                    
                    const start = new Date(c.dateDebut).getTime();
                    const end = new Date(c.dateFin).getTime();
                    let status = 'EN_COURS';
                    if (now < start) status = 'PLANIFIEE';
                    else if (now > end) status = 'TERMINEE';

                    return {
                        ...c,
                        uiStatus: status,
                        uiLeadsCount: campLeads.length,
                        uiRevenue: revenue,
                        uiCpl: campLeads.length > 0 ? c.budget / campLeads.length : 0
                    };
                });
            },
            error: (err) => console.error('Erreur chargement données', err)
        });
    }

    get totalBudget(): number {
        return this.campaigns.reduce((sum, c) => sum + c.budget, 0);
    }

    get totalRevenue(): number {
        return this.campaigns.reduce((sum, c) => sum + (c.uiRevenue || 0), 0);
    }

    get totalLeads(): number {
        return this.campaigns.reduce((sum, c) => sum + (c.uiLeadsCount || 0), 0);
    }

    getBudgetPercent(budget: number): number {
        if (this.campaigns.length === 0) return 0;
        const max = Math.max(...this.campaigns.map(c => c.budget), 1);
        return (budget / max) * 100;
    }

    openForm(): void {
        this.nom = '';
        this.type = 'SOCIAL';
        this.budget = 0;
        this.dateDebut = '';
        this.dateFin = '';
        this.showForm = true;
    }

    save(): void {
        const nom = (this.nom || '').trim();
        if (!nom) return;

        const newCampaign: Partial<Campaign> = {
            nom,
            type: this.type,
            budget: this.budget,
            dateDebut: this.dateDebut ? new Date(this.dateDebut).toISOString() : new Date().toISOString(),
            dateFin: this.dateFin ? new Date(this.dateFin).toISOString() : new Date(Date.now() + 86400000).toISOString()
        };

        this.crm.createCampaign(newCampaign).subscribe({
            next: () => {
                this.showForm = false;
                this.loadCampaigns();
            },
            error: (err) => console.error('Erreur creation campagne', err)
        });
    }

    delete(id: number): void {
        if (confirm('Etes-vous sur de supprimer cette campagne ?')) {
            this.crm.deleteCampaign(id).subscribe({
                next: () => {
                    this.campaigns = this.campaigns.filter(c => c.id !== id);
                },
                error: (err) => console.error('Erreur suppression campagne', err)
            });
        }
    }
}
