import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Campaign, CampaignIconType, CampaignStatusKey } from '../models/campaign.model';
import type { CrmCampaign } from '../models/crm.model';

const ICONS_BY_MOD: CampaignIconType[] = ['email', 'social', 'event', 'seo'];

@Injectable({ providedIn: 'root' })
export class CampaignService {

    private readonly http = inject(HttpClient);

    /** Base CRM : exemple `GET /api/campaigns` côté doc ; passerelle réelle `/api/crm/campagnes`. */
    private readonly campaignsUrl = `${environment.apiUrl}/api/crm/campagnes`;

    getCampaigns(): Observable<Campaign[]> {
        return this.http.get<CrmCampaign[]>(this.campaignsUrl).pipe(
            map(rows => rows.map(row => this.toCampaign(row)))
        );
    }

    createCampaign(body: Pick<CrmCampaign, 'nom' | 'budget' | 'dateDebut' | 'dateFin'>): Observable<Campaign> {
        return this.http.post<CrmCampaign>(this.campaignsUrl, body).pipe(map(d => this.toCampaign(d)));
    }

    deleteCampaign(id: number): Observable<void> {
        return this.http.delete<void>(`${this.campaignsUrl}/${id}`);
    }

    private toCampaign(api: CrmCampaign): Campaign {
        const sentCount = api.nombreLeads ?? 0;
        return {
            id: api.id,
            title: api.nom,
            startDate: api.dateDebut,
            status: this.deriveStatus(api),
            budget: Number(api.budget),
            sentCount,
            openRate: null,
            iconType: this.iconTypeFor(api.id)
        };
    }

    private deriveStatus(api: CrmCampaign): CampaignStatusKey {
        const start = new Date(api.dateDebut).getTime();
        const end = new Date(api.dateFin).getTime();
        const now = Date.now();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
            return 'BROUILLON';
        }
        if (now < start) {
            return 'PLANIFIEE';
        }
        if (now > end) {
            return 'TERMINEE';
        }
        return 'ACTIVE';
    }

    private iconTypeFor(id: number): CampaignIconType {
        return ICONS_BY_MOD[Math.abs(id) % ICONS_BY_MOD.length];
    }
}
