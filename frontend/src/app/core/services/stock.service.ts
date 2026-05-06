import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Article, Depot, MouvementStock, StockDepot,
  Inventaire, ReservationStock, MouvementStockLine
} from '../models/stock.models';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  traceId: string;
}

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8000/api/stock';

  // ─── ARTICLES ────────────────────────────────────────────────────────────
  getArticles(page = 1, size = 20, search?: string): Observable<ApiResponse<any>> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (search) p = p.set('search', search);
    return this.http.get<ApiResponse<any>>(`${this.base}/articles`, { params: p });
  }
  getArticle(id: number): Observable<ApiResponse<Article>> {
    return this.http.get<ApiResponse<Article>>(`${this.base}/articles/${id}`);
  }
  getAlertes(): Observable<ApiResponse<Article[]>> {
    return this.http.get<ApiResponse<Article[]>>(`${this.base}/articles/alertes`);
  }
  getStockByDepot(articleId: number): Observable<ApiResponse<StockDepot[]>> {
    return this.http.get<ApiResponse<StockDepot[]>>(`${this.base}/articles/${articleId}/stocks`);
  }
  createArticle(data: Partial<Article>): Observable<ApiResponse<Article>> {
    return this.http.post<ApiResponse<Article>>(`${this.base}/articles`, data);
  }
  updateArticle(id: number, data: Partial<Article>): Observable<ApiResponse<Article>> {
    return this.http.put<ApiResponse<Article>>(`${this.base}/articles/${id}`, data);
  }
  deleteArticle(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/articles/${id}`);
  }

  // ─── DEPOTS ──────────────────────────────────────────────────────────────
  getDepots(): Observable<ApiResponse<Depot[]>> {
    return this.http.get<ApiResponse<Depot[]>>(`${this.base}/depots`);
  }
  getDepot(id: number): Observable<ApiResponse<Depot>> {
    return this.http.get<ApiResponse<Depot>>(`${this.base}/depots/${id}`);
  }
  createDepot(data: Partial<Depot>): Observable<ApiResponse<Depot>> {
    return this.http.post<ApiResponse<Depot>>(`${this.base}/depots`, data);
  }
  updateDepot(id: number, data: Partial<Depot>): Observable<ApiResponse<Depot>> {
    return this.http.put<ApiResponse<Depot>>(`${this.base}/depots/${id}`, data);
  }
  deleteDepot(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/depots/${id}`);
  }

  // ─── MOUVEMENTS ──────────────────────────────────────────────────────────
  getMouvements(page = 1, size = 20): Observable<ApiResponse<any>> {
    const p = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<any>>(`${this.base}/mouvements`, { params: p });
  }
  createMouvement(data: any): Observable<ApiResponse<MouvementStock>> {
    return this.http.post<ApiResponse<MouvementStock>>(`${this.base}/mouvements`, data);
  }
  getHistoriqueMouvements(articleId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/mouvements/article/${articleId}`);
  }
  getMouvementLignes(mouvementId: number): Observable<ApiResponse<MouvementStockLine[]>> {
    return this.http.get<ApiResponse<MouvementStockLine[]>>(`${this.base}/mouvements/${mouvementId}/lignes`);
  }
  annulerMouvement(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/mouvements/${id}`);
  }

  // ─── INVENTAIRES ─────────────────────────────────────────────────────────
  getInventaires(): Observable<ApiResponse<Inventaire[]>> {
    return this.http.get<ApiResponse<Inventaire[]>>(`${this.base}/inventaires`);
  }
  getInventaire(id: number): Observable<ApiResponse<Inventaire>> {
    return this.http.get<ApiResponse<Inventaire>>(`${this.base}/inventaires/${id}`);
  }
  demarrerInventaire(depotId: number): Observable<ApiResponse<Inventaire>> {
    const p = new HttpParams().set('depotId', depotId);
    return this.http.post<ApiResponse<Inventaire>>(`${this.base}/inventaires/demarrer`, null, { params: p });
  }
  saisirQuantiteInventaire(lineId: number, quantiteReelle: number): Observable<ApiResponse<void>> {
    const p = new HttpParams().set('quantiteReelle', quantiteReelle);
    return this.http.put<ApiResponse<void>>(`${this.base}/inventaires/lines/${lineId}`, null, { params: p });
  }
  validerInventaire(id: number): Observable<ApiResponse<Inventaire>> {
    return this.http.post<ApiResponse<Inventaire>>(`${this.base}/inventaires/${id}/valider`, null);
  }

  // ─── RESERVATIONS ────────────────────────────────────────────────────────
  createReservation(data: any): Observable<ApiResponse<ReservationStock>> {
    return this.http.post<ApiResponse<ReservationStock>>(`${this.base}/reservations`, data);
  }
  consommerReservation(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/reservations/${id}/consommer`, null);
  }
  libererReservation(sourceType: string, sourceId: number): Observable<ApiResponse<void>> {
    const p = new HttpParams().set('sourceType', sourceType).set('sourceId', sourceId);
    return this.http.post<ApiResponse<void>>(`${this.base}/reservations/liberer`, null, { params: p });
  }
}
