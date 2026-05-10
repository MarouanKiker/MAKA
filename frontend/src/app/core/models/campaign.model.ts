/** Modèle carte « Campagnes marketing » (projection UI après mapping API). */
export type CampaignStatusKey = 'ACTIVE' | 'TERMINEE' | 'PLANIFIEE' | 'BROUILLON';

/** Variante déterministe pour icônes (mapping `CampaignService` à partir du type métier CRM si ajout futur ou de l'id). */
export type CampaignIconType = 'email' | 'social' | 'event' | 'seo';

export interface Campaign {
    id: number;
    title: string;
    startDate: string;
    status: CampaignStatusKey;
    budget: number;
    sentCount: number;
    /** Pourcentage 0–100 si fourni ou calculé côté API ; `null` = non disponible. */
    openRate: number | null;
    iconType: CampaignIconType;
}
