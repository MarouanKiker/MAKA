// modèles finance alignés avec les DTOs Spring Boot du backend

// ----- Statuts et Modes (Enums) -----
export type StatutFacture = 'BROUILLON' | 'VALIDEE' | 'ENVOYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
export type StatutPaiement = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
export type ModePaiement  = 'VIREMENT' | 'CARTE_BANCAIRE' | 'CHEQUE' | 'ESPECES';

// ----- Facture -----
export interface LigneFacture {
    id: number;
    produit: string;
    quantite: number;
    prixUnitaire: number;
    montantHT: number;
}

export interface LigneFactureRequest {
    produit: string;
    quantite: number;
    prixUnitaire: number;
}

export interface Facture {
    id: number;
    numero: string;
    tauxTVA: number;
    montantHT: number;
    montantTVA: number;
    montantTTC: number;
    montantPaye: number;
    resteAPayer: number;
    statut: StatutFacture;
    dateCreation: string;
    dateMiseAJour: string;
    lignes: LigneFacture[];
}

export interface FactureRequest {
    numero: string;
    tauxTVA: number;          // entre 0 et 1, ex: 0.20 pour 20%
    lignes: LigneFactureRequest[];
}

// ----- Paiement -----
export interface Paiement {
    id: number;
    factureId: number;
    montant: number;
    modePaiement: ModePaiement;
    referenceTransaction: string;
    statut: StatutPaiement;
    datePaiement: string;
    dateCreation: string;
}

export interface CreatePaiementRequest {
    factureId: number;
    montant: number;
    modePaiement: ModePaiement;
    referenceTransaction?: string;
}

// ----- Compte Bancaire -----
export interface CompteBancaire {
    id: number;
    iban: string;
    banque: string;
}

// ----- Journal -----
export interface JournalTransaction {
    id: number;
    date: string;
    credit: number;
    debit: number;
    description: string;
    factureId: number;
    paiementId: number;
}

// ----- Stats -----
export interface FinanceStats {
    totalCredit: number;
    totalDebit: number;
    solde: number;
}
