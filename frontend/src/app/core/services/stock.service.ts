import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ArticleStock,
    CreateArticleStockRequest,
    CreateDepotStockRequest,
    CreateMouvementStockRequest,
    DepotStock,
    MouvementStock,
    StockApiResponse,
    StockDepotLine,
    StockPage
} from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {

    private api = environment.apiUrl + '/api/stock';

    constructor(private http: HttpClient) {}

    getArticles(search = '', page = 1, size = 20): Observable<StockPage<ArticleStock>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);
        if (search.trim()) {
            params = params.set('search', search.trim());
        }
        return this.http.get<StockApiResponse<StockPage<ArticleStock>>>(`${this.api}/articles`, { params })
            .pipe(map(res => res.data));
    }

    getAlertes(): Observable<ArticleStock[]> {
        return this.http.get<StockApiResponse<ArticleStock[]>>(`${this.api}/articles/alertes`)
            .pipe(map(res => res.data || []));
    }

    createArticle(request: CreateArticleStockRequest): Observable<ArticleStock> {
        return this.http.post<StockApiResponse<ArticleStock>>(`${this.api}/articles`, request)
            .pipe(map(res => res.data));
    }

    updateArticle(id: number, request: CreateArticleStockRequest): Observable<ArticleStock> {
        return this.http.put<StockApiResponse<ArticleStock>>(`${this.api}/articles/${id}`, request)
            .pipe(map(res => res.data));
    }

    deleteArticle(id: number): Observable<void> {
        return this.http.delete<StockApiResponse<void>>(`${this.api}/articles/${id}`)
            .pipe(map(() => undefined));
    }

    getStockByDepot(articleId: number): Observable<StockDepotLine[]> {
        return this.http.get<StockApiResponse<StockDepotLine[]>>(`${this.api}/articles/${articleId}/stocks`)
            .pipe(map(res => res.data || []));
    }

    getDepots(): Observable<DepotStock[]> {
        return this.http.get<StockApiResponse<DepotStock[]>>(`${this.api}/depots`)
            .pipe(map(res => res.data || []));
    }

    createDepot(request: CreateDepotStockRequest): Observable<DepotStock> {
        return this.http.post<StockApiResponse<DepotStock>>(`${this.api}/depots`, request)
            .pipe(map(res => res.data));
    }

    getMouvements(page = 1, size = 20): Observable<StockPage<MouvementStock>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<StockApiResponse<StockPage<MouvementStock>>>(`${this.api}/mouvements`, { params })
            .pipe(map(res => res.data));
    }

    createMouvement(request: CreateMouvementStockRequest): Observable<MouvementStock> {
        return this.http.post<StockApiResponse<MouvementStock>>(`${this.api}/mouvements`, request)
            .pipe(map(res => res.data));
    }
}
