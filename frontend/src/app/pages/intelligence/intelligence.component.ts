import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';

// ============================================================
// MAKA Intelligence — Centre de Commandement IA Cross-Modules
// Dashboard premium avec Score Sante, Alertes, KPIs, Forecast,
// Segmentation et Copilot RAG++
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

    // --- Cross-Analytics (nouveau) ---
    crossData: any = null;
    healthScore = 0;
    healthAnimated = 0;

    // --- Copilot RAG++ ---
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

    // --- UI ---
    activeTab: 'overview' | 'forecast' | 'segmentation' = 'overview';

    @ViewChild('chatContainer') chatContainer!: ElementRef;

    constructor(private ai: AiService) {}

    ngOnInit(): void {
        this.messages.push({
            texte: "Bonjour ! Je suis MAKA Copilot, le cerveau IA de votre entreprise. Je suis connecté à tous vos modules : Ventes, CRM, Finance et RH. Posez-moi n'importe quelle question !",
            auteur: 'ai',
            heure: this.getHeure()
        });

        this.chargerDonneesReelles();
    }

    chargerDonneesReelles(): void {
        this.loadingData = true;

        // Charger Cross-Analytics (nouveau endpoint central)
        this.ai.getCrossAnalytics().subscribe({
            next: (data) => {
                this.crossData = data;
                this.healthScore = data.score_sante || 0;
                this.animateHealthScore();
            },
            error: (err) => {
                console.error('Erreur Cross-Analytics', err);
                // Fallback : on continue sans les donnees cross
                this.crossData = null;
            }
        });

        // Charger KPI ventes
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

    /** Animation progressive du score de sante (0 -> valeur reelle) */
    animateHealthScore(): void {
        this.healthAnimated = 0;
        const target = this.healthScore;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
            this.healthAnimated += step;
            if (this.healthAnimated >= target) {
                this.healthAnimated = target;
                clearInterval(interval);
            }
        }, 30);
    }

    // --- Copilot Chat Logic ---
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
            error: () => {
                this.messages.push({
                    texte: "Désolé, je n'arrive pas à contacter le moteur IA. Le service est-il démarré ?",
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

    // --- Utilitaires affichage ---
    formatMontant(val: number): string {
        if (!val) return '0';
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return Math.round(val / 1000) + 'K';
        return val.toString();
    }

    getBarHeight(valeur: number): number {
        if (!this.forecastData || !this.forecastData.donnees) return 0;
        let max = Math.max(...this.forecastData.donnees.map((d: any) => d.valeur), 1);
        return (valeur / max) * 100;
    }

    /** Calcul du circumference pour la jauge SVG circulaire */
    getScoreOffset(): number {
        const circumference = 2 * Math.PI * 54; // rayon = 54
        return circumference - (this.healthAnimated / 100) * circumference;
    }

    getAlerteBorderClass(type: string): string {
        switch (type) {
            case 'success': return 'border-l-emerald-500';
            case 'warning': return 'border-l-amber-500';
            case 'danger': return 'border-l-red-500';
            case 'info': return 'border-l-blue-500';
            default: return 'border-l-slate-500';
        }
    }

    getAlerteIconClass(type: string): string {
        switch (type) {
            case 'success': return 'text-emerald-500';
            case 'warning': return 'text-amber-500';
            case 'danger': return 'text-red-500';
            case 'info': return 'text-blue-500';
            default: return 'text-slate-500';
        }
    }

    getAlerteBgClass(type: string): string {
        switch (type) {
            case 'success': return 'bg-emerald-50 dark:bg-emerald-500/10';
            case 'warning': return 'bg-amber-50 dark:bg-amber-500/10';
            case 'danger': return 'bg-red-50 dark:bg-red-500/10';
            case 'info': return 'bg-blue-50 dark:bg-blue-500/10';
            default: return 'bg-slate-50 dark:bg-slate-500/10';
        }
    }
}
