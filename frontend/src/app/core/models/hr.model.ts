// =============================================================
// Modèles de données pour le module RH
// Alignés sur les entités JPA du backend (diagramme UML)
// =============================================================

export interface Employe {
    id: number;
    nom: string;
    email: string;
    dateEmbauche: string;
    authUserId?: number;
}

export interface Contrat {
    id: number;
    type: string;          // CDI, CDD, Stage
    dateDebut: string;
    dateFin?: string;
    salaireBrut: number;
    poste: string;
    employe?: Employe;
    employeId?: number;
}

export interface DemandeConge {
    id: number;
    dateDebut: string;
    dateFin: string;
    type?: string;         // Maladie, CP, RTT
    motif?: string;
    etat: string;          // EnAttente, Validé, Refusé
    dateDemande: string;
    employe?: Employe;
    employeId?: number;
}

export interface FicheDePaie {
    id: number;
    mois: number;
    annee: number;
    salaireBrut: number;
    cotisations: number;
    salaireNet: number;
    statut: string;
    employe?: Employe;
    employeId?: number;
}

export interface Reclamation {
    id: number;
    sujet: string;
    description: string;
    dateEnvoi: string;
    reponseRH?: string;
    statut: string;        // Ouvert, Résolu
    employe?: Employe;
    employeId?: number;
}
