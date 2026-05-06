// Modèles CRM alignés avec les DTOs .NET du backend baseline

export interface Lead {
    id: number;
    source: string;
    statut: string; // 'NOUVEAU', 'QUALIFIE', 'EN_COURS', 'CONVERTI', 'PERDU'
    score: number;
    dateCreation: string;
    campagneId: number | null;
    campagneNom?: string | null;
    opportunite?: Opportunity | null;
}

export interface Opportunity {
    id: number;
    titre: string;
    valeur: number;
    statut: string; // 'NOUVELLE', 'EN_COURS', 'GAGNEE', 'PERDUE'
    dateCloture: string;
    leadId: number;
    leadSource?: string;
}

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

// Task : aligné avec TaskItem.cs du backend
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

// Ticket : aligné avec Ticket.cs du backend
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

// Interaction : aligné avec Interaction.cs du backend
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
