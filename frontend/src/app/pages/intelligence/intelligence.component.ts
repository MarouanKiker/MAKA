import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';

// ============================================================
// Page MAKA Intelligence — Module IA du dashboard
// ============================================================

interface ChatMessage {
    texte: string;
    auteur: 'user' | 'ai';
    heure: string;
}

@Component({
    selector: 'app-intelligence',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './intelligence.component.html',
    styleUrl: './intelligence.component.scss'
})
export class IntelligenceComponent implements OnInit {

    // --- chatbot ---
    messages: ChatMessage[] = [];
    messageInput = '';
    chatLoading = false;

    // --- forecast ---
    forecastData: any = null;

    // --- kpis ---
    kpis: any = null;

    // --- insights ---
    insights: any[] = [];

    // --- etats de chargement ---
    loading = true;

    @ViewChild('chatContainer') chatContainer!: ElementRef;

    constructor(private ai: AiService) {}

    ngOnInit(): void {
        // message de bienvenue du chatbot
        this.messages.push({
            texte: "Bonjour ! Je suis l'assistant IA de MAKA ERP. Posez-moi une question sur vos ventes, devis ou previsions.",
            auteur: 'ai',
            heure: this.getHeure()
        });

        // charger les donnees
        this.chargerDonnees();
    }

    // charger les KPI, forecast et insights en parallele
    chargerDonnees(): void {
        this.ai.getKpis().subscribe({
            next: (data) => { this.kpis = data; },
            error: () => { this.kpis = { ca_actuel: 270000, ca_prevu: 291600, croissance: 4.7, total_devis: 12, total_commandes: 8, taux_conversion: 66.7 }; }
        });

        this.ai.getForecast().subscribe({
            next: (data) => { this.forecastData = data; this.loading = false; },
            error: () => { this.genererForecastDemo(); this.loading = false; }
        });

        this.ai.getInsights().subscribe({
            next: (data) => { this.insights = data; },
            error: () => { this.insights = [
                { icone: 'fa-arrow-trend-up', texte: 'CA en hausse de 4.7% ce mois.', type: 'success' },
                { icone: 'fa-lightbulb', texte: 'Pack Premium represente 35% des ventes.', type: 'info' },
                { icone: 'fa-clock', texte: '3 devis en attente depuis +15 jours.', type: 'warning' }
            ]; }
        });
    }

    // envoyer un message au chatbot
    envoyerMessage(): void {
        let texte = this.messageInput.trim();
        if (!texte || this.chatLoading) return;

        // ajouter le message user
        this.messages.push({ texte: texte, auteur: 'user', heure: this.getHeure() });
        this.messageInput = '';
        this.chatLoading = true;
        this.scrollChat();

        // appeler l'API
        this.ai.chat(texte).subscribe({
            next: (data) => {
                this.messages.push({ texte: data.reponse, auteur: 'ai', heure: this.getHeure() });
                this.chatLoading = false;
                this.scrollChat();
            },
            error: () => {
                this.messages.push({
                    texte: "Je suis temporairement indisponible. Verifiez que le service sales est demarre.",
                    auteur: 'ai',
                    heure: this.getHeure()
                });
                this.chatLoading = false;
                this.scrollChat();
            }
        });
    }

    // gerer touche Entree dans l'input
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.envoyerMessage();
        }
    }

    // scroller le chat en bas
    scrollChat(): void {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }

    // heure actuelle formatee
    getHeure(): string {
        let now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    // calculer la hauteur d'une barre de graphique (en %)
    getBarHeight(valeur: number): number {
        if (!this.forecastData) return 0;
        let max = Math.max(...this.forecastData.donnees.map((d: any) => d.valeur));
        return (valeur / max) * 100;
    }

    // formater un montant en DH
    formatMontant(val: number): string {
        if (val >= 1000) return Math.round(val / 1000) + 'K';
        return val.toString();
    }

    // forecast de demo si l'API n'est pas disponible
    genererForecastDemo(): void {
        this.forecastData = {
            tendance: 'hausse',
            croissance: 8.2,
            donnees: [
                { mois: 'Sep', valeur: 220000, type: 'reel' },
                { mois: 'Oct', valeur: 235000, type: 'reel' },
                { mois: 'Nov', valeur: 248000, type: 'reel' },
                { mois: 'Dec', valeur: 275000, type: 'reel' },
                { mois: 'Jan', valeur: 242000, type: 'reel' },
                { mois: 'Fev', valeur: 258000, type: 'reel' },
                { mois: 'Mar', valeur: 270000, type: 'reel' },
                { mois: 'Avr', valeur: 285000, type: 'prediction' },
                { mois: 'Mai', valeur: 295000, type: 'prediction' },
                { mois: 'Jun', valeur: 310000, type: 'prediction' },
            ]
        };
    }
}
