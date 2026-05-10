import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadScraperService } from '../../core/services/lead-scraper.service';
import { CrmService } from '../../core/services/crm.service';
import type { ScrapedGoogleLead } from '../../core/models/lead-scrape.model';
import type { Lead } from '../../core/models/crm.model';

@Component({
    selector: 'app-google-scraper',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './google-scraper.component.html',
    styleUrl: './google-scraper.component.scss'
})
export class GoogleScraperComponent {

    /** Libellés français via \u00e9chappements Unicode (affichage fiable quelle que soit l’encodage du .html). */
    readonly ui = {
        title: 'Prospection web \u2014 prospects',
        subtitle:
            'R\u00e9sultats DuckDuckGo : nom, site et e-mail requis \u2014 t\u00e9l\u00e9phone facultatif. L\u2019ajout CRM envoie le nom de l\u2019entreprise, l\u2019e-mail et le t\u00e9l\u00e9phone.',
        reqPlaceholder: 'Ex : entreprises d\u00e9veloppement web Oujda',
        resultsLabel: 'R\u00e9sultats',
        btnSearch: 'Lancer la recherche',
        searching: 'Recherche en cours...',
        colCompany: 'Nom de l\'entreprise',
        colWeb: 'Site Web',
        colPhone: 'T\u00e9l\u00e9phone',
        colEmail: 'Email',
        colSource: 'Source',
        colAction: 'Action',
        emptyTitle: 'Aucune fiche exploitable',
        emptyHint:
            'Aucune entreprise avec nom, site et e-mail d\u00e9tect\u00e9s. Reformulez la requ\u00eate ou r\u00e9essayez.',
        hintBefore: 'Saisissez une requ\u00eate puis lancez la recherche.'
    };

    query = '';
    numResults = 5;
    isLoading = false;
    results: ScrapedGoogleLead[] = [];
    errorMessage: string | null = null;
    leadStatus: Record<string, 'saving' | 'saved' | 'error'> = {};
    /** Évite d’afficher « Aucun prospect » avant le premier lancement. */
    hasQueried = false;

    constructor(
        private readonly leadScraper: LeadScraperService,
        private readonly crm: CrmService
    ) {}

    launchScrape(): void {
        const q = this.query.trim();
        if (!q || this.isLoading) return;

        this.isLoading = true;
        this.errorMessage = null;
        this.results = [];
        this.leadStatus = {};

        this.leadScraper.scrapeGoogleLeads(q, this.numResults).subscribe({
            next: (rows) => {
                this.results = rows.filter(
                    (r) =>
                        r.companyName?.trim() &&
                        r.website?.trim() &&
                        r.email?.trim() &&
                        r.phone?.trim()
                );
                this.isLoading = false;
                this.hasQueried = true;
            },
            error: (err: any) => {
                this.isLoading = false;
                const detail = err.error?.detail;
                this.errorMessage =
                    typeof detail === 'string'
                        ? detail
                        : Array.isArray(detail)
                          ? detail.map((d: { msg?: string }) => d.msg ?? '').join(' ')
                          : err.name === 'TimeoutError'
                            ? 'La recherche prend trop de temps. Essayez avec moins de r\u00e9sultats.'
                            : err.message ?? 'Erreur lors de la recherche';
            }
        });
    }

    addToLead(row: ScrapedGoogleLead): void {
        if (this.leadStatus[row.website] === 'saving' || this.leadStatus[row.website] === 'saved') return;
        const name = row.companyName?.trim();
        const email = row.email?.trim();
        const telephone = this.normalizeTelephone(row.phone);
        if (!name || !email) return;

        this.leadStatus[row.website] = 'saving';
        const lead: Partial<Lead> = {
            source: name.slice(0, 100),
            entreprise: name,
            nomContact: name,
            email,
            telephone,
            statut: 'NOUVEAU',
            score: 65,
            dateCreation: new Date().toISOString(),
            campagneId: null
        };

        this.crm.createLead(lead).subscribe({
            next: () => {
                this.leadStatus[row.website] = 'saved';
            },
            error: (err) => {
                console.error('Erreur creation lead depuis scraping', err);
                this.leadStatus[row.website] = 'error';
            }
        });
    }

    /** CRM limite le champ à 50 caractères (CreateLeadDto). */
    private normalizeTelephone(raw: string | undefined): string {
        const s = (raw ?? '').trim().replace(/\s+/g, ' ');
        return s.length > 50 ? s.slice(0, 50) : s;
    }

    getLeadButtonLabel(row: ScrapedGoogleLead): string {
        const status = this.leadStatus[row.website];
        if (status === 'saving') return 'Ajout...';
        if (status === 'saved') return 'Ajout\u00e9';
        if (status === 'error') return 'R\u00e9essayer';
        return 'Ajouter au lead';
    }
}
