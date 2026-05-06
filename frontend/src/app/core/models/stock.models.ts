// =====================================================================
// MAKA ERP — Modèles TypeScript pour le Stock-Service v2
// Alignés avec le backend Java (après suppression de stock_total_global)
// =====================================================================

export interface Article {
  id: number;
  reference: string;
  designation: string;
  description?: string;
  unite?: string;            // PIECE | KG | LITRE | M | M2
  prixAchat: number;
  prixVente: number;
  stockTotal: number;        // Calculé dynamiquement par le backend (SUM article_stock_depot)
  seuilMinAlerte: number;
  emplacementRayon?: string;
  categorieId?: number;
  dateCreation?: string;
}

export interface Depot {
  id: number;
  nom: string;
  adresse?: string;
  capaciteMax: number;
  dateCreation?: string;
}

export interface MouvementStock {
  id: number;
  typeMvt: 'ENTREE' | 'SORTIE' | 'TRANSFERT';
  sourceType?: string;       // VENTE | ACHAT | INVENTAIRE | RETOUR | MANUEL
  sourceId?: number;
  statut: 'BROUILLON' | 'VALIDE' | 'ANNULE';
  depotSourceId?: number;
  depotDestinationId?: number;
  utilisateurId: number;
  motif?: string;
  dateMouvement: string;
}

export interface MouvementStockLine {
  id: number;
  mouvementId: number;
  articleId: number;
  quantite: number;
  articleReference?: string;
  articleDesignation?: string;
  articleUnite?: string;
}

export interface StockDepot {
  depot_nom: string;
  depot_id: number;
  quantite: number;
}

export interface ReservationStock {
  id: number;
  articleId: number;
  depotId: number;
  quantite: number;
  sourceType: string;
  sourceId: number;
  statut: 'ACTIVE' | 'CONSUMED' | 'RELEASED';
  createdAt: string;
}

export interface Inventaire {
  id: number;
  depotId: number;
  statut: 'EN_COURS' | 'VALIDE' | 'ANNULE';
  dateInv: string;
  createdBy: number;
  lines?: InventaireLine[];
}

export interface InventaireLine {
  id: number;
  inventaireId: number;
  articleId: number;
  quantiteSysteme: number;
  quantiteReelle: number;
  ecart: number;
  articleReference?: string;
  articleDesignation?: string;
  articleUnite?: string;
}
