import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StockService } from '../../core/services/stock.service';
import {
    ArticleStock,
    CreateArticleStockRequest,
    CreateDepotStockRequest,
    CreateMouvementStockRequest,
    DepotStock,
    MouvementStock,
    SourceMouvementStock,
    TypeMouvementStock,
    UniteArticle
} from '../../core/models/stock.model';

@Component({
    selector: 'app-stock',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock.component.html',
    styleUrls: ['../shared/crm-page.scss', './stock.component.scss']
})
export class StockComponent implements OnInit {

    articles: ArticleStock[] = [];
    depots: DepotStock[] = [];
    mouvements: MouvementStock[] = [];
    alertes: ArticleStock[] = [];

    search = '';
    isLoading = false;
    message = '';

    showArticleForm = false;
    showDepotForm = false;
    showMouvementForm = false;
    selectedArticle: ArticleStock | null = null;

    unites: UniteArticle[] = ['PIECE', 'KG', 'LITRE', 'M', 'M2'];
    typeMouvements: TypeMouvementStock[] = ['ENTREE', 'SORTIE', 'TRANSFERT'];
    sourceTypes: SourceMouvementStock[] = ['MANUEL', 'ACHAT', 'VENTE', 'INVENTAIRE', 'RETOUR'];

    articleForm: CreateArticleStockRequest = this.emptyArticleForm();
    depotForm: CreateDepotStockRequest = this.emptyDepotForm();
    mouvementForm: CreateMouvementStockRequest = this.emptyMouvementForm();

    constructor(private stockSvc: StockService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.isLoading = true;
        forkJoin({
            articlesPage: this.stockSvc.getArticles(this.search, 1, 50),
            depots: this.stockSvc.getDepots(),
            mouvementsPage: this.stockSvc.getMouvements(1, 20),
            alertes: this.stockSvc.getAlertes()
        }).subscribe({
            next: (data) => {
                this.articles = data.articlesPage?.data || [];
                this.depots = data.depots || [];
                this.mouvements = data.mouvementsPage?.data || [];
                this.alertes = data.alertes || [];
                this.isLoading = false;
            },
            error: (err) => {
                this.message = this.readError(err);
                this.isLoading = false;
            }
        });
    }

    openArticleForm(article?: ArticleStock): void {
        this.selectedArticle = article || null;
        this.articleForm = article ? {
            reference: article.reference,
            designation: article.designation,
            description: article.description || '',
            unite: article.unite || 'PIECE',
            prixAchat: article.prixAchat || 0,
            prixVente: article.prixVente || 0,
            seuilMinAlerte: article.seuilMinAlerte || 0,
            emplacementRayon: article.emplacementRayon || '',
            categorieId: article.categorieId || null
        } : this.emptyArticleForm();
        this.showArticleForm = true;
    }

    saveArticle(): void {
        if (!this.articleForm.reference.trim() || !this.articleForm.designation.trim()) {
            this.showMessage('Reference et designation sont obligatoires.');
            return;
        }

        const request = {
            ...this.articleForm,
            reference: this.articleForm.reference.trim(),
            designation: this.articleForm.designation.trim(),
            description: this.articleForm.description?.trim(),
            emplacementRayon: this.articleForm.emplacementRayon?.trim(),
            categorieId: this.articleForm.categorieId || null
        };

        const save$ = this.selectedArticle
            ? this.stockSvc.updateArticle(this.selectedArticle.id, request)
            : this.stockSvc.createArticle(request);

        save$.subscribe({
            next: () => {
                this.showArticleForm = false;
                this.showMessage(this.selectedArticle ? 'Article mis a jour.' : 'Article cree.');
                this.loadAll();
            },
            error: (err) => this.showMessage(this.readError(err))
        });
    }

    deleteArticle(article: ArticleStock): void {
        if (!confirm(`Supprimer l'article ${article.reference} ?`)) return;
        this.stockSvc.deleteArticle(article.id).subscribe({
            next: () => {
                this.showMessage('Article supprime.');
                this.loadAll();
            },
            error: (err) => this.showMessage(this.readError(err))
        });
    }

    openDepotForm(): void {
        this.depotForm = this.emptyDepotForm();
        this.showDepotForm = true;
    }

    saveDepot(): void {
        if (!this.depotForm.nom.trim()) {
            this.showMessage('Nom du depot obligatoire.');
            return;
        }
        this.stockSvc.createDepot({
            ...this.depotForm,
            nom: this.depotForm.nom.trim(),
            adresse: this.depotForm.adresse?.trim()
        }).subscribe({
            next: () => {
                this.showDepotForm = false;
                this.showMessage('Depot cree.');
                this.loadAll();
            },
            error: (err) => this.showMessage(this.readError(err))
        });
    }

    openMouvementForm(article?: ArticleStock): void {
        this.mouvementForm = this.emptyMouvementForm();
        if (article) {
            this.mouvementForm.articleId = article.id;
        }
        this.showMouvementForm = true;
    }

    saveMouvement(): void {
        const m = this.mouvementForm;
        if (!m.articleId || !m.quantite || m.quantite < 1) {
            this.showMessage('Article et quantite sont obligatoires.');
            return;
        }
        if ((m.typeMvt === 'SORTIE' || m.typeMvt === 'TRANSFERT') && !m.depotSourceId) {
            this.showMessage('Depot source obligatoire pour une sortie ou un transfert.');
            return;
        }
        if ((m.typeMvt === 'ENTREE' || m.typeMvt === 'TRANSFERT') && !m.depotDestinationId) {
            this.showMessage('Depot destination obligatoire pour une entree ou un transfert.');
            return;
        }

        this.stockSvc.createMouvement({
            ...m,
            depotSourceId: m.depotSourceId || null,
            depotDestinationId: m.depotDestinationId || null,
            sourceId: m.sourceId || null,
            motif: m.motif?.trim()
        }).subscribe({
            next: () => {
                this.showMouvementForm = false;
                this.showMessage('Mouvement enregistre.');
                this.loadAll();
            },
            error: (err) => this.showMessage(this.readError(err))
        });
    }

    getStockValue(): number {
        return this.articles.reduce((sum, article) => sum + ((article.stockTotal || 0) * (article.prixAchat || 0)), 0);
    }

    getDepotName(id?: number): string {
        if (!id) return '-';
        return this.depots.find(d => d.id === id)?.nom || `Depot #${id}`;
    }

    getArticleLabel(id?: number): string {
        if (!id) return '-';
        const article = this.articles.find(a => a.id === id);
        return article ? `${article.reference} - ${article.designation}` : `Article #${id}`;
    }

    stockStatus(article: ArticleStock): string {
        if ((article.stockTotal || 0) <= 0) return 'rupture';
        if ((article.stockTotal || 0) <= article.seuilMinAlerte) return 'alerte';
        return 'ok';
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) this.message = '';
        }, 4000);
    }

    private emptyArticleForm(): CreateArticleStockRequest {
        return {
            reference: '',
            designation: '',
            description: '',
            unite: 'PIECE',
            prixAchat: 0,
            prixVente: 0,
            seuilMinAlerte: 0,
            emplacementRayon: '',
            categorieId: null
        };
    }

    private emptyDepotForm(): CreateDepotStockRequest {
        return { nom: '', adresse: '', capaciteMax: 0 };
    }

    private emptyMouvementForm(): CreateMouvementStockRequest {
        return {
            articleId: 0,
            typeMvt: 'ENTREE',
            quantite: 1,
            depotSourceId: null,
            depotDestinationId: null,
            sourceType: 'MANUEL',
            sourceId: null,
            motif: ''
        };
    }

    private readError(err: any): string {
        const body = err?.error;
        if (!body) return 'Erreur reseau ou serveur stock.';
        if (typeof body === 'string') return body;
        if (body.message) return String(body.message);
        if (body.detail) return String(body.detail);
        if (body.details?.length) return String(body.details[0]);
        return 'Erreur inconnue du service stock.';
    }
}
