import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============================================================
// Service IA — Appels API vers le module Intelligence
// ============================================================

@Injectable({ providedIn: 'root' })
export class AiService {

    // url de base du service sales (via la gateway nginx)
    private baseUrl = 'http://localhost:8000/api/sales/ai';

    constructor(private http: HttpClient) {}

    // envoyer un message au chatbot
    chat(message: string): Observable<any> {
        return this.http.post(this.baseUrl + '/chat', { message: message });
    }

    // recuperer les previsions de ventes
    getForecast(): Observable<any> {
        return this.http.get(this.baseUrl + '/forecast');
    }

    // recuperer les KPI intelligents
    getKpis(): Observable<any> {
        return this.http.get(this.baseUrl + '/kpis');
    }

    // recuperer les insights
    getInsights(): Observable<any> {
        return this.http.get(this.baseUrl + '/insights');
    }
}
