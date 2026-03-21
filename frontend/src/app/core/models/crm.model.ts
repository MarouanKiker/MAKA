// donnees mock pour le module crm

export interface Account {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    responsable: string;
}

export interface Contact {
    id: number;
    nom: string;
    type: string;
    adresse: string;
    accountId: number;
}

export interface Lead {
    id: number;
    source: string;
    statut: number; // Enum: 0=NOUVEAU, 1=CONTACTE, 2=QUALIFIE, 3=CONVERTI, 4=PERDU
    score: number;
    dateCreation: string;
    campagneId: number | null;
    opportunite?: Opportunity | null; 
}

export interface Opportunity {
    id: number;
    nom: string;
    montant: number;
    statut: number; // Enum: 0=NOUVELLE, 1=EN_COURS, 2=GAGNEE, 3=PERDUE
    dateCloture: string;
    leadId: number;
}

export interface Campaign {
    id: number;
    nom: string;
    budget: number;
    dateDebut: string;
    dateFin: string;
    leads?: Lead[];
}

export interface Account {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    responsable: string;
}

export interface Contact {
    id: number;
    nom: string;
    type: string;
    adresse: string;
    accountId: number;
}

export interface Task {
    id: number;
    titre: string;
    description: string;
    dateEcheance: string;
    priorite: string;
    statut: string;
    assigneA: string;
}

export interface Ticket {
    id: number;
    sujet: string;
    statut: string;
    priorite: string;
    dateCreation: string;
    accountId: number;
    agent: string;
}

export interface Interaction {
    id: number;
    type: string;
    dateInteraction: string;
    contactId: number;
    notes: string;
}

export interface Interaction {
    id: number;
    type: string;
    dateInteraction: string;
    contactId: number;
    notes: string;
}
