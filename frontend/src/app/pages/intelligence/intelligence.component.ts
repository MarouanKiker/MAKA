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

    // --- Copilot (Real RAG) ---
    messages: ChatMessage[] = [];
    messageInput = '';
    chatLoading = false;
    showCopilot = false;

    // --- Data from Backend ---
    segmentationData: any = null;
    forecastData: any = null;
    kpis: any = null;
    insights: any[] = [];
    loadingData = true;

    @ViewChild('chatContainer') chatContainer!: ElementRef;

    constructor(private ai: AiService) {}

    ngOnInit(): void {
        this.messages.push({
            texte: "Bonjour ! Je suis MAKA Copilot. Je suis connecté à votre base de données réelle. Posez-moi des questions sur vos ventes, vos clients VIP ou vos prévisions.",
            auteur: 'ai',
            heure: this.getHeure()
        });

        this.chargerDonneesReelles();
    }

    chargerDonneesReelles(): void {
        this.loadingData = true;

        // Charger KPI
        this.ai.getKpis().subscribe({
            next: (data) => { this.kpis = data; },
            error: (err) => { console.error('Erreur KPI', err); }
        });

        // Charger Forecast
        this.ai.getForecast().subscribe({
            next: (data) => { this.forecastData = data; },
            error: (err) => { console.error('Erreur Forecast', err); }
        });

        // Charger Segmentation (K-Means)
        this.ai.getSegmentation().subscribe({
            next: (data) => { 
                this.segmentationData = data; 
                this.loadingData = false;
            },
            error: (err) => { 
                console.error('Erreur Segmentation', err); 
                this.loadingData = false;
            }
        });

        // Charger Insights
        this.ai.getInsights().subscribe({
            next: (data) => { this.insights = data; },
            error: (err) => { console.error('Erreur Insights', err); }
        });
    }

    // --- Copilot Chat Logic (Real Backend Call) ---
    toggleCopilot(): void {
        this.showCopilot = !this.showCopilot;
        if (this.showCopilot) this.scrollChat();
    }

    envoyerMessage(): void {
        let texte = this.messageInput.trim();
        if (!texte || this.chatLoading) return;

        this.messages.push({ texte: texte, auteur: 'user', heure: this.getHeure() });
        this.messageInput = '';
        this.chatLoading = true;
        this.scrollChat();

        // APPEL AU VRAI BACKEND RAG (app.ai.chatbot)
        this.ai.chat(texte).subscribe({
            next: (response) => {
                this.messages.push({ 
                    texte: response.reponse, 
                    auteur: 'ai', 
                    heure: this.getHeure() 
                });
                this.chatLoading = false;
                this.scrollChat();
            },
            error: (err) => {
                this.messages.push({ 
                    texte: "Désolé, je n'arrive pas à contacter le moteur d'Intelligence Artificielle. Le service sales est-il démarré ?", 
                    auteur: 'ai', 
                    heure: this.getHeure() 
                });
                this.chatLoading = false;
                this.scrollChat();
            }
        });
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.envoyerMessage();
        }
    }

    scrollChat(): void {
        setTimeout(() => {
            if (this.chatContainer) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }

    getHeure(): string {
        let now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    // Utilitaires affichage
    formatMontant(val: number): string {
        if (val >= 1000) return Math.round(val / 1000) + 'K';
        return val ? val.toString() : '0';
    }

    getBarHeight(valeur: number): number {
        if (!this.forecastData || !this.forecastData.donnees) return 0;
        let max = Math.max(...this.forecastData.donnees.map((d: any) => d.valeur), 1);
        return (valeur / max) * 100;
    }
}
