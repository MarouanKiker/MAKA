import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture, Paiement, CompteBancaire, JournalTransaction, FinanceStats } from '../models/finance.model';
import { environment } from '../../../environments/environment';

// service qui gere les appels HTTP vers le backend Finance (Spring Boot)
@Injectable({ providedIn: 'root' })
export class FinanceService {

    // url de base de l'api finance
    private api = environment.apiUrl + '/api/finance';

    constructor(private http: HttpClient) {}

    // --- FACTURES ---

    // recuperer toutes les factures
    getFactures(): Observable<Facture[]> {
        return this.http.get<Facture[]>(this.api + '/factures');
    }

    // creer une facture
    createFacture(facture: Partial<Facture>): Observable<Facture> {
        return this.http.post<Facture>(this.api + '/factures', facture);
    }

    // modifier une facture
    updateFacture(id: number, facture: Partial<Facture>): Observable<Facture> {
        return this.http.put<Facture>(this.api + '/factures/' + id, facture);
    }

    // supprimer une facture
    deleteFacture(id: number): Observable<void> {
        return this.http.delete<void>(this.api + '/factures/' + id);
    }

    // --- PAIEMENTS ---

    getPaiements(): Observable<Paiement[]> {
        return this.http.get<Paiement[]>(this.api + '/paiements');
    }

    createPaiement(paiement: Partial<Paiement>): Observable<Paiement> {
        return this.http.post<Paiement>(this.api + '/paiements', paiement);
    }

    deletePaiement(id: number): Observable<void> {
        return this.http.delete<void>(this.api + '/paiements/' + id);
    }

    // --- COMPTES BANCAIRES ---

    getComptesBancaires(): Observable<CompteBancaire[]> {
        return this.http.get<CompteBancaire[]>(this.api + '/comptes-bancaires');
    }

    createCompteBancaire(compte: Partial<CompteBancaire>): Observable<CompteBancaire> {
        return this.http.post<CompteBancaire>(this.api + '/comptes-bancaires', compte);
    }

    deleteCompteBancaire(id: number): Observable<void> {
        return this.http.delete<void>(this.api + '/comptes-bancaires/' + id);
    }

    // --- JOURNAL ---

    getJournal(): Observable<JournalTransaction[]> {
        return this.http.get<JournalTransaction[]>(this.api + '/journal');
    }

    getStats(): Observable<FinanceStats> {
        return this.http.get<FinanceStats>(this.api + '/journal/stats');
    }
}
