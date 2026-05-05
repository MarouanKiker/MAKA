// modèles finance alignés avec les DTOs Spring Boot du backend (Version PRO)

// ----- Statuts -----
export type StatutFacture = 'BROUILLON' | 'VALIDEE' | 'ENVOYEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';
export type StatutPaiement = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

// ----- Facture -----
export interface LigneFacture {
    id: number;
    produit: string;
    quantite: number;
    prixUnitaire: number;
    totalLigne: number;
}

export interface LigneFactureRequest {
    produit: string;
    quantite: number;
    prixUnitaire: number;
}

export interface Facture {
    id: number;
    numero: string;
    clientNom: string;
    dateEcheance: string;
    tauxTVA: number;
    montantHT: number;
    montantTVA: number;
    montantTTC: number;
    taxe: number;
    montantPaye: number;
    resteAPayer: number;
    statut: StatutFacture;
    dateCreation: string;
    dateMiseAJour: string;
    lignes: LigneFacture[];
}

export interface FactureRequest {
    numero: string;
    clientNom: string;
    dateEcheance: string | null;
    tauxTVA: number;
    taxe: number;
    lignes: LigneFactureRequest[];
}

// ----- Paiement -----
export interface Paiement {
    id: number;
    factureId: number;
    montant: number;
    modePaiement: string; // Libellé
    compteBancaire: string; // Nom banque
    referenceTransaction: string;
    type: 'CLIENT' | 'FOURNISSEUR';
    statut: StatutPaiement;
    datePaiement: string;
    dateCreation: string;
}

export interface CreatePaiementRequest {
    factureId: number;
    montant: number;
    modePaiementId: number;
    compteBancaireId?: number;
    referenceTransaction?: string;
    type: 'CLIENT' | 'FOURNISSEUR';
}

// ----- Mode de Paiement (Entité) -----
export interface ModePaiement {
    id: number;
    libelle: string;
    actif: boolean;
}

// ----- Compte Bancaire -----
export interface CompteBancaire {
    id: number;
    iban: string;
    nomBanque: string;
    soldeActuel: number;
    devise: string;
}

// ----- Journal -----
export interface JournalTransaction {
    id: number;
    dateEcriture: string;
    compteDebit: string;
    compteCredit: string;
    debit: number;
    credit: number;
    description: string;
    referenceType: string;
    referenceId: number;
}
