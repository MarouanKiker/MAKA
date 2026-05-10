import { Component } from '@angular/core';
import { CommonModule, NgClass, DecimalPipe, DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, startWith, map, catchError, shareReplay } from 'rxjs/operators';
import { CampaignService } from '../../core/services/campaign.service';
import { Campaign, CampaignIconType, CampaignStatusKey } from '../../core/models/campaign.model';

interface CampaignSummary {
    count: number;
    totalBudget: number;
    totalSent: number;
    avgOpenRatePct: number | null;
}

@Component({
    selector: 'app-campaigns',
    standalone: true,
    imports: [CommonModule, NgClass, FormsModule, DecimalPipe, DatePipe, AsyncPipe],
    templateUrl: './campaigns.component.html',
    styleUrls: ['../shared/crm-page.scss', './campaigns.component.scss']
})
export class CampaignsComponent {

    showForm = false;
    nom = '';
    budget = 0;
    dateDebut = '';
    dateFin = '';

    readonly campaignTypes = [
        { id: 'SOCIAL', label: 'Réseaux Sociaux' },
        { id: 'EMAIL', label: 'Emailing' },
        { id: 'EVENT', label: 'Événement' },
        { id: 'SEO', label: 'SEO / Web' },
        { id: 'OTHER', label: 'Autre' }
    ];

    /** Types de canal (UI formulaire uniquement ; non persistés par l’API CRM actuelle). */
    formType = 'SOCIAL';

    private readonly reload$ = new Subject<void>();

    readonly campaigns$: Observable<Campaign[]> = this.reload$.pipe(
        startWith(void 0),
        switchMap(() =>
            this.campaignService.getCampaigns().pipe(catchError(() => of<Campaign[]>([])))
        ),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    readonly summary$: Observable<CampaignSummary> = this.campaigns$.pipe(
        map(list => ({
            count: list.length,
            totalBudget: list.reduce((s, c) => s + c.budget, 0),
            totalSent: list.reduce((s, c) => s + c.sentCount, 0),
            avgOpenRatePct: this.avgOpenRate(list)
        }))
    );

    constructor(private readonly campaignService: CampaignService) { }

    badgeClass(status: CampaignStatusKey): Record<string, boolean> {
        return {
            'campaign-badge-active': status === 'ACTIVE',
            'campaign-badge-done': status === 'TERMINEE',
            'campaign-badge-planned': status === 'PLANIFIEE',
            'campaign-badge-draft': status === 'BROUILLON'
        };
    }

    statusLabel(status: CampaignStatusKey): string {
        switch (status) {
            case 'ACTIVE': return 'Active';
            case 'TERMINEE': return 'Terminée';
            case 'PLANIFIEE': return 'Planifiée';
            case 'BROUILLON': return 'Brouillon';
            default: return status;
        }
    }

    iconFaClass(kind: CampaignIconType): string {
        switch (kind) {
            case 'email': return 'fa-solid fa-envelope-open-text';
            case 'social': return 'fa-solid fa-share-nodes';
            case 'event': return 'fa-solid fa-champagne-glasses';
            case 'seo': return 'fa-solid fa-magnifying-glass-chart';
            default: return 'fa-solid fa-bullhorn';
        }
    }

    formatOpenRate(rate: number | null): string {
        return rate !== null ? `${rate.toFixed(1)} %` : 'N/D';
    }

    refreshList(): void {
        this.reload$.next();
    }

    openForm(): void {
        this.nom = '';
        this.formType = 'SOCIAL';
        this.budget = 0;
        this.dateDebut = '';
        this.dateFin = '';
        this.showForm = true;
    }

    save(): void {
        const nom = (this.nom || '').trim();
        if (!nom) return;

        this.campaignService
            .createCampaign({
                nom,
                budget: this.budget,
                dateDebut: this.dateDebut ? new Date(this.dateDebut).toISOString() : new Date().toISOString(),
                dateFin: this.dateFin ? new Date(this.dateFin).toISOString() : new Date(Date.now() + 86400000).toISOString()
            })
            .subscribe({
                next: () => {
                    this.showForm = false;
                    this.refreshList();
                },
                error: (err) => console.error('Erreur creation campagne', err)
            });
    }

    delete(id: number): void {
        if (!confirm('Etes-vous sur de supprimer cette campagne ?')) return;
        this.campaignService.deleteCampaign(id).subscribe({
            next: () => this.refreshList(),
            error: (err) => console.error('Erreur suppression campagne', err)
        });
    }

    private avgOpenRate(list: Campaign[]): number | null {
        const present = list.map(c => c.openRate).filter((r): r is number => r !== null);
        if (present.length === 0) return null;
        return present.reduce((a, b) => a + b, 0) / present.length;
    }
}
