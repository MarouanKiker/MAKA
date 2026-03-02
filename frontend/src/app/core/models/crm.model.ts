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
    statut: string;
    score: number;
    dateCreation: string;
    responsable: string;
    campagneId: number | null;
}

export interface Opportunity {
    id: number;
    titre: string;
    valeur: number;
    statut: string;
    dateCloture: string;
    leadId: number;
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

export interface Campaign {
    id: number;
    nom: string;
    budget: number;
    dateDebut: string;
    dateFin: string;
}

export interface Interaction {
    id: number;
    type: string;
    dateInteraction: string;
    contactId: number;
    notes: string;
}
