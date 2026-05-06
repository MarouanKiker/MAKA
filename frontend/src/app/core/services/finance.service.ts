import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Facture, FactureRequest,
    Paiement, CreatePaiementRequest,
    JournalTransaction, StatutFacture,
    CompteBancaire, ModePaiement
} from '../models/finance.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {

    private api = environment.apiUrl + '/api/finance';

    constructor(private http: HttpClient) {}

    // --- Factures ---
    getFactures(): Observable<Facture[]> {
        return this.http.get<Facture[]>(`${this.api}/factures`);
    }

    getFacture(id: number): Observable<Facture> {
        return this.http.get<Facture>(`${this.api}/factures/${id}`);
    }

    createFacture(request: FactureRequest): Observable<Facture> {
        return this.http.post<Facture>(`${this.api}/factures`, request);
    }

    changeStatutFacture(id: number, statut: StatutFacture): Observable<Facture> {
        return this.http.patch<Facture>(`${this.api}/factures/${id}/statut`, { statut });
    }

    deleteFacture(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/factures/${id}`);
    }

    // --- Paiements ---
    getPaiements(): Observable<Paiement[]> {
        return this.http.get<Paiement[]>(`${this.api}/paiements`);
    }

    createPaiement(request: CreatePaiementRequest): Observable<Paiement> {
        return this.http.post<Paiement>(`${this.api}/paiements`, request);
    }

    validerPaiement(id: number): Observable<Paiement> {
        return this.http.patch<Paiement>(`${this.api}/paiements/${id}/valider`, {});
    }

    // --- Journal & Compta ---
    getJournal(): Observable<JournalTransaction[]> {
        return this.http.get<JournalTransaction[]>(`${this.api}/journal`);
    }

    // --- Comptes Bancaires (APIs Réelles) ---
    getComptesBancaires(): Observable<CompteBancaire[]> {
        return this.http.get<CompteBancaire[]>(`${this.api}/comptes-bancaires`);
    }

    createCompteBancaire(compte: Partial<CompteBancaire>): Observable<CompteBancaire> {
        return this.http.post<CompteBancaire>(`${this.api}/comptes-bancaires`, compte);
    }

    deleteCompteBancaire(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/comptes-bancaires/${id}`);
    }

    // --- Modes de Paiement ---
    getModesPaiement(): Observable<ModePaiement[]> {
        return this.http.get<ModePaiement[]>(`${this.api}/modes-paiement`);
    }

    // --- Stats & Rejet ---
    getStats(): Observable<any> {
        return this.http.get<any>(`${this.api}/journal/stats`);
    }

    rejeterPaiement(id: number): Observable<Paiement> {
        return this.http.patch<Paiement>(`${this.api}/paiements/${id}/rejeter`, {});
    }
}
