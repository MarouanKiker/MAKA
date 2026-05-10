/** Réponse de POST /api/leads/scrape (service Sales / FastAPI). */
export interface ScrapedGoogleLead {
    companyName: string;
    website: string;
    email: string;
    phone: string;
    source: string;
}
