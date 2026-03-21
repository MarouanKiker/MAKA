import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Campaign } from '../../core/models/crm.model';

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
    budget = 0;
    dateDebut = '';
    dateFin = '';

    campaigns: Campaign[] = [];

    constructor(private crm: CrmService) { }

    ngOnInit(): void {
        this.loadCampaigns();
    }

    loadCampaigns(): void {
        this.crm.getCampaigns().subscribe({
            next: (data) => this.campaigns = data,
            error: (err) => console.error('Erreur chargement campagnes', err)
        });
    }

    get totalBudget(): number {
        return this.campaigns.reduce((sum, c) => sum + c.budget, 0);
    }

    getBudgetPercent(budget: number): number {
        if (this.campaigns.length === 0) return 0;
        const max = Math.max(...this.campaigns.map(c => c.budget), 1);
        return (budget / max) * 100;
    }

    openForm(): void {
        this.nom = '';
        this.budget = 0;
        this.dateDebut = '';
        this.dateFin = '';
        this.showForm = true;
    }

    save(): void {
        const newCampaign: Partial<Campaign> = {
            nom: this.nom,
            budget: this.budget,
            dateDebut: this.dateDebut ? new Date(this.dateDebut).toISOString() : new Date().toISOString(),
            dateFin: this.dateFin ? new Date(this.dateFin).toISOString() : new Date().toISOString()
        };

        this.crm.createCampaign(newCampaign).subscribe({
            next: (created) => {
                this.campaigns.push(created);
                this.showForm = false;
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
