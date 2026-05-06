import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================
// Service IA — Appels API vers le module Intelligence (gateway /api/sales)
// Inclut : Cross-Analytics, Chatbot RAG++, Forecast, Segmentation
// ============================================================

@Injectable({ providedIn: 'root' })
export class AiService {

    private baseUrl = `${environment.apiUrl}/api/sales/ai`;

    constructor(private http: HttpClient) {}

    /** Rapport cross-modules : score sante, alertes, KPIs agreges */
    getCrossAnalytics(): Observable<any> {
        return this.http.get(this.baseUrl + '/cross-analytics');
    }

    /** Chatbot RAG++ connecte a tous les modules */
    chat(message: string): Observable<any> {
        return this.http.post(this.baseUrl + '/chat', { message });
    }

    /** Previsions ML (Gradient Boosting) */
    getForecast(): Observable<any> {
        return this.http.get(this.baseUrl + '/forecast');
    }

    /** KPIs ventes calcules depuis la BDD */
    getKpis(): Observable<any> {
        return this.http.get(this.baseUrl + '/kpis');
    }

    /** Insights intelligents */
    getInsights(): Observable<any> {
        return this.http.get(this.baseUrl + '/insights');
    }

    /** Segmentation K-Means des clients */
    getSegmentation(): Observable<any> {
        return this.http.get(this.baseUrl + '/segmentation');
    }

    /** Scoring ML d'un lead */
    scoreLead(leadData: any): Observable<any> {
        return this.http.post(this.baseUrl + '/lead-score', leadData);
    }
}
