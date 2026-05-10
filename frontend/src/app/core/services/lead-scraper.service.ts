import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { ScrapedGoogleLead } from '../models/lead-scrape.model';

@Injectable({ providedIn: 'root' })
export class LeadScraperService {

    private readonly http = inject(HttpClient);

    /** Via gateway : POST http://localhost:8000/api/leads/scrape → sales-service */
    private readonly scrapeUrl = `${environment.apiUrl}/api/leads/scrape`;

    scrapeGoogleLeads(query: string, numResults: number): Observable<ScrapedGoogleLead[]> {
        return this.http.post<ScrapedGoogleLead[]>(this.scrapeUrl, {
            query: query.trim(),
            num_results: Math.min(Math.max(numResults, 1), 10)
        }).pipe(timeout(50000));
    }
}
