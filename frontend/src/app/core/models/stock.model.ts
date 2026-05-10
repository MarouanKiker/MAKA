export type UniteArticle = 'PIECE' | 'KG' | 'LITRE' | 'M' | 'M2';
export type TypeMouvementStock = 'ENTREE' | 'SORTIE' | 'TRANSFERT';
export type SourceMouvementStock = 'VENTE' | 'ACHAT' | 'INVENTAIRE' | 'RETOUR' | 'MANUEL';

export interface StockApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    traceId: string;
}

export interface StockPage<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ArticleStock {
    id: number;
    reference: string;
    designation: string;
    description?: string;
    unite: UniteArticle;
    prixAchat: number;
    prixVente: number;
    seuilMinAlerte: number;
    emplacementRayon?: string;
    categorieId?: number;
    dateCreation?: string;
    stockTotal: number;
}

export interface CreateArticleStockRequest {
    reference: string;
    designation: string;
    description?: string;
    unite: UniteArticle;
    prixAchat: number;
    prixVente: number;
    seuilMinAlerte: number;
    emplacementRayon?: string;
    categorieId?: number | null;
}

export interface DepotStock {
    id: number;
    nom: string;
    adresse?: string;
    capaciteMax: number;
    dateCreation?: string;
}

export interface CreateDepotStockRequest {
    nom: string;
    adresse?: string;
    capaciteMax: number;
}

export interface MouvementStock {
    id: number;
    typeMvt: TypeMouvementStock;
    sourceType?: SourceMouvementStock;
    sourceId?: number;
    statut: 'BROUILLON' | 'VALIDE' | 'ANNULE';
    depotSourceId?: number;
    depotDestinationId?: number;
    utilisateurId?: number;
    motif?: string;
    dateMouvement?: string;
}

export interface CreateMouvementStockRequest {
    articleId: number;
    typeMvt: TypeMouvementStock;
    quantite: number;
    depotSourceId?: number | null;
    depotDestinationId?: number | null;
    sourceType?: SourceMouvementStock;
    sourceId?: number | null;
    motif?: string;
}

export interface StockDepotLine {
    depot_id: number;
    depot_nom: string;
    quantite: number;
}
