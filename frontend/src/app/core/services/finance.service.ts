import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Facture, FactureRequest,
    Paiement, CreatePaiementRequest,
    JournalTransaction, FinanceStats, StatutFacture,
    CompteBancaire
} from '../models/finance.model';
import { environment } from '../../../environments/environment';

// Service qui gère les appels HTTP vers le backend Finance (Spring Boot)
// Gateway Nginx: /api/finance/* → finance-service:6000/api/v1/*
@Injectable({ providedIn: 'root' })
export class FinanceService {

    private api = environment.apiUrl + '/api/finance';

    constructor(private http: HttpClient) {}

    // =============================================
    // FACTURES  →  /api/finance/factures
    // =============================================

    getFactures(): Observable<Facture[]> {
        return this.http.get<Facture[]>(`${this.api}/factures`);
    }

    getFacture(id: number): Observable<Facture> {
        return this.http.get<Facture>(`${this.api}/factures/${id}`);
    }

    createFacture(request: FactureRequest): Observable<Facture> {
        return this.http.post<Facture>(`${this.api}/factures`, request);
    }

    updateFacture(id: number, request: FactureRequest): Observable<Facture> {
        return this.http.put<Facture>(`${this.api}/factures/${id}`, request);
    }

    changeStatutFacture(id: number, statut: StatutFacture): Observable<Facture> {
        return this.http.patch<Facture>(`${this.api}/factures/${id}/statut`, { statut });
    }

    deleteFacture(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/factures/${id}`);
    }

    // =============================================
    // PAIEMENTS  →  /api/finance/paiements
    // =============================================

    getPaiements(): Observable<Paiement[]> {
        return this.http.get<Paiement[]>(`${this.api}/paiements`);
    }

    getPaiement(id: number): Observable<Paiement> {
        return this.http.get<Paiement>(`${this.api}/paiements/${id}`);
    }

    getPaiementsByFacture(factureId: number): Observable<Paiement[]> {
        return this.http.get<Paiement[]>(`${this.api}/paiements/facture/${factureId}`);
    }

    createPaiement(request: CreatePaiementRequest): Observable<Paiement> {
        return this.http.post<Paiement>(`${this.api}/paiements`, request);
    }

    validerPaiement(id: number): Observable<Paiement> {
        return this.http.patch<Paiement>(`${this.api}/paiements/${id}/valider`, {});
    }

    rejeterPaiement(id: number): Observable<Paiement> {
        return this.http.patch<Paiement>(`${this.api}/paiements/${id}/rejeter`, {});
    }

    // =============================================
    // JOURNAL  →  /api/finance/journal
    // =============================================

    getJournal(): Observable<JournalTransaction[]> {
        return this.http.get<JournalTransaction[]>(`${this.api}/journal`);
    }

    getStats(): Observable<FinanceStats> {
        return this.http.get<FinanceStats>(`${this.api}/journal/stats`);
    }

    // =============================================
    // COMPTES BANCAIRES (mock - pas de backend dédié)
    // =============================================
    private _comptes: CompteBancaire[] = [];

    getComptesBancaires(): Observable<CompteBancaire[]> {
        return new Observable(observer => {
            observer.next(this._comptes);
            observer.complete();
        });
    }

    createCompteBancaire(compte: Partial<CompteBancaire>): Observable<CompteBancaire> {
        return new Observable(observer => {
            const newCompte: CompteBancaire = {
                id: this._comptes.length + 1,
                iban: compte.iban || '',
                banque: compte.banque || ''
            };
            this._comptes.push(newCompte);
            observer.next(newCompte);
            observer.complete();
        });
    }

    deleteCompteBancaire(id: number): Observable<void> {
        return new Observable(observer => {
            this._comptes = this._comptes.filter(c => c.id !== id);
            observer.next();
            observer.complete();
        });
    }
}
