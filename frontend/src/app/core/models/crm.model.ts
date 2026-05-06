// Modèles du module CRM — alignés avec les DTOs du backend .NET 8

// ---- Compte (Account) ----
export interface Account {
    id: number;
    nom: string;
    email?: string;
    telephone?: string;
    secteurActivite?: string;
    adresse?: string;
    dateCreation: string;
    nombreContacts: number;
}

export interface CreateAccountPayload {
    nom: string;
    email?: string;
    telephone?: string;
    secteurActivite?: string;
    adresse?: string;
}

export interface PaginatedAccounts {
    data: Account[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ---- Contact ----
export interface Contact {
    id: number;
    prenom: string;
    nom: string;
    email?: string;
    telephone?: string;
    type: string;
    adresse?: string;
    dateCreation: string;
    compteId: number;
    compteNom: string;
}

export interface CreateContactPayload {
    prenom: string;
    nom: string;
    email?: string;
    telephone?: string;
    type: string;
    adresse?: string;
    compteId: number;
}

// ---- Lead ----
export interface Lead {
    id: number;
    source: string;
    statut: number; // 0=NOUVEAU, 1=CONTACTE, 2=QUALIFIE, 3=CONVERTI, 4=PERDU
    score: number;
    dateCreation: string;
    campagneId: number | null;
    campagneNom?: string | null;
    opportunite?: Opportunity | null;
}

// ---- Opportunity ----
export interface Opportunity {
    id: number;
    titre: string;
    valeur: number;
    statut: number; // 0=NOUVELLE, 1=EN_COURS, 2=GAGNEE, 3=PERDUE
    dateCloture?: string;
    leadId: number;
    leadSource?: string;
}

// ---- Campaign ----
export interface Campaign {
    id: number;
    nom: string;
    type?: string;
    budget: number;
    dateDebut: string;
    dateFin: string;
    leads?: Lead[];
    
    // Propriétés calculées pour l'UI
    uiStatus?: string;
    uiLeadsCount?: number;
    uiRevenue?: number;
    uiCpl?: number;
}

// ---- Task ----
export interface Task {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    isCompleted: boolean;
    leadId?: number | null;
    
    // Propriétés calculées pour l'UI
    uiTitle?: string;
    uiDescription?: string; // ADDED
    uiPriority?: string;
    uiLeadName?: string | null;
    uiAssignedToName?: string | null; // ADDED
    isOverdue?: boolean;
}

export interface CreateTaskDto {
    title: string;
    description: string;
    dueDate: string;
    leadId?: number | null;
}

// ---- Ticket ----
export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: string; // 'Open', 'Pending', 'Closed'
    createdAt: string;
    leadId?: number | null;
}

export interface CreateTicketDto {
    title: string;
    description: string;
    status?: string;
    leadId?: number | null;
}

// ---- Interaction ----
export interface Interaction {
    id: number;
    type: string; // 'Call', 'Email', 'Meeting'
    notes: string;
    date: string;
    leadId?: number | null;
}

export interface CreateInteractionDto {
    type: string;
    notes: string;
    leadId?: number | null;
}
