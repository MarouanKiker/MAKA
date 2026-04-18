// modeles pour le module finance

export interface Facture {
    id: number;
    numero: string;
    montant: number;
    statut: string;
    tauxTVA: number;
    montantTTC: number;
    taxe: number;
    utilisateurId: number;
}

export interface Paiement {
    id: number;
    date: string;
    montant: number;
    type: string;
    factureId: number;
    utilisateurId: number;
}

export interface CompteBancaire {
    id: number;
    iban: string;
    banque: string;
    utilisateurId: number;
}

export interface JournalTransaction {
    id: number;
    date: string;
    credit: number;
    debit: number;
    description: string;
    factureId: number;
    paiementId: number;
}

export interface FinanceStats {
    totalCredit: number;
    totalDebit: number;
    solde: number;
}
