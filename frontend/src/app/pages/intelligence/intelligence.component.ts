import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';

export interface PulseAiEvent {
    id: string;
    label: string;
    detail: string;
    timeLabel: string;
    tone: 'success' | 'info' | 'warning' | 'neutral';
    icon: string;
}

export interface QuickMetric {
    label: string;
    value: string;
    delta?: string;
    positive?: boolean;
}

export interface McpConnectorView {
    label: string;
    provider: string;
    route: string;
    configured: boolean;
    statusLabel: string;
    icon: string;
}

export interface MarketingSummaryView {
    totalCustomers: string;
    totalRevenue: string;
    conversionRate: string;
    segmentsCount: string;
    crmStatus: string;
}

export interface MarketingSegmentView {
    key: string;
    name: string;
    description: string;
    color: string;
    customers: number;
    revenue: string;
    revenueShare: string;
    conversionRate: string;
    recommendation: string;
    action: string;
}

export interface MarketingCustomerView {
    name: string;
    source: string;
    segment: string;
    color: string;
    score: number;
    revenue: string;
    orders: number;
    quotes: number;
    action: string;
}

@Component({
    selector: 'app-intelligence',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './intelligence.component.html',
    styleUrl: './intelligence.component.scss'
})
export class IntelligenceComponent implements OnInit {
    commandQuery = '';

    readonly pulseEvents = signal<PulseAiEvent[]>([
        {
            id: 'boot',
            label: 'MAKA Intelligence',
            detail: 'Service IA pret. Les donnees reelles sont chargees depuis le backend Sales.',
            timeLabel: 'Maintenant',
            tone: 'info',
            icon: 'fa-solid fa-brain'
        }
    ]);

    readonly healthScore = signal(50);
    readonly healthLabel = signal('Chargement');

    readonly quickMetrics = signal<QuickMetric[]>([
        { label: 'CA mensuel', value: '0 MAD', delta: '0 %', positive: true },
        { label: 'Leads nouveaux', value: '0', delta: 'CRM', positive: undefined },
        { label: 'Tickets ouverts', value: '0', delta: 'Support', positive: true }
    ]);

    readonly marketingSummary = signal<MarketingSummaryView>({
        totalCustomers: '0',
        totalRevenue: '0 MAD',
        conversionRate: '0 %',
        segmentsCount: '0',
        crmStatus: 'Chargement'
    });

    readonly marketingSegments = signal<MarketingSegmentView[]>([]);
    readonly marketingCustomers = signal<MarketingCustomerView[]>([]);

    readonly mcpConnectors = signal<McpConnectorView[]>([
        {
            label: 'Email',
            provider: 'local-draft',
            route: '/api/sales/ai/mcp/email/draft',
            configured: false,
            statusLabel: 'Mode local',
            icon: 'fa-solid fa-envelope'
        },
        {
            label: 'Agenda',
            provider: 'local-proposal',
            route: '/api/sales/ai/mcp/calendar/event',
            configured: false,
            statusLabel: 'Mode local',
            icon: 'fa-solid fa-calendar-days'
        }
    ]);

    readonly spotlightAlerts = signal<{ title: string; module: string; severity: 'low' | 'med' | 'high' }[]>([
        { title: 'Chargement des alertes IA', module: 'IA', severity: 'low' }
    ]);

    readonly forecastPreview = signal<{ month: string; actual: number; predicted: number }[]>([
        { month: 'N/A', actual: 0, predicted: 1 }
    ]);

    readonly maxForecastBar = computed(() => {
        const vals = this.forecastPreview()
            .flatMap((row) => [row.actual, row.predicted])
            .filter((value) => value > 0);
        return Math.max(...vals, 1);
    });

    readonly commandBusy = signal(false);
    readonly emailBusy = signal(false);

    constructor(private readonly ai: AiService) {}

    ngOnInit(): void {
        this.loadIntelligenceData();
        this.loadMarketingIntelligence();
        this.loadMcpStatus();
    }

    loadIntelligenceData(): void {
        this.ai.getCrossAnalytics().subscribe({
            next: (data) => {
                const score = Number(data?.score_sante ?? 50);
                this.healthScore.set(Math.max(0, Math.min(100, score)));
                this.healthLabel.set(data?.niveau_sante || 'Mode local');

                const kpis = data?.kpis || {};
                this.quickMetrics.set([
                    {
                        label: 'CA mensuel',
                        value: `${Number(kpis.ca_mensuel || kpis.ca_total || 0).toLocaleString('fr-FR')} MAD`,
                        delta: `${Number(kpis.croissance_ca || 0)} %`,
                        positive: Number(kpis.croissance_ca || 0) >= 0
                    },
                    {
                        label: 'Leads nouveaux',
                        value: String(kpis.leads_nouveaux ?? kpis.total_leads ?? 0),
                        delta: 'CRM',
                        positive: undefined
                    },
                    {
                        label: 'Tickets ouverts',
                        value: String(kpis.tickets_ouverts ?? 0),
                        delta: 'Support',
                        positive: Number(kpis.tickets_ouverts ?? 0) === 0
                    }
                ]);

                const alertes = Array.isArray(data?.alertes) ? data.alertes : [];
                this.spotlightAlerts.set(alertes.slice(0, 5).map((alerte: any) => ({
                    title: alerte.titre || alerte.texte || 'Alerte IA',
                    module: alerte.module || 'IA',
                    severity: this.alertSeverity(alerte.type)
                })));

                const modulesStatus = data?.modules_status || {};
                const unavailable = Object.entries(modulesStatus)
                    .filter(([, status]) => status !== 'ok')
                    .map(([module]) => module);
                if (unavailable.length) {
                    this.pushPulse(
                        'Sources IA',
                        `Certaines sources demandent une session valide ou sont indisponibles : ${unavailable.join(', ')}.`,
                        'warning'
                    );
                }
            },
            error: () => {
                this.pushPulse('Service IA', 'Impossible de charger le tableau de bord IA. Mode local conserve.', 'warning');
            }
        });

        this.ai.getForecast().subscribe({
            next: (data) => {
                const rows = Array.isArray(data?.donnees) ? data.donnees : [];
                if (!rows.length) return;
                this.forecastPreview.set(rows.slice(-6).map((row: any) => ({
                    month: String(row.mois || ''),
                    actual: row.type === 'reel' ? Number(row.valeur || 0) : 0,
                    predicted: Number(row.valeur || 0)
                })));
            },
            error: () => {
                this.pushPulse('Forecast IA', 'La prevision des ventes est temporairement indisponible.', 'warning');
            }
        });
    }

    loadMarketingIntelligence(): void {
        this.ai.getMarketingIntelligence().subscribe({
            next: (data) => {
                const summary = data?.summary || {};
                const segments = Array.isArray(data?.segments) ? data.segments : [];
                const customers = Array.isArray(data?.customers) ? data.customers : [];

                this.marketingSummary.set({
                    totalCustomers: String(summary.total_customers ?? 0),
                    totalRevenue: this.formatMoney(summary.total_revenue),
                    conversionRate: `${Number(summary.conversion_rate || 0).toLocaleString('fr-FR')} %`,
                    segmentsCount: String(summary.segments_count ?? segments.length),
                    crmStatus: this.marketingCrmLabel(summary.crm_status)
                });

                this.marketingSegments.set(segments.slice(0, 5).map((segment: any) => ({
                    key: String(segment.key || segment.name || 'segment'),
                    name: String(segment.name || 'Segment'),
                    description: String(segment.description || ''),
                    color: String(segment.color || '#2563eb'),
                    customers: Number(segment.nb_clients || 0),
                    revenue: this.formatMoney(segment.revenue_total),
                    revenueShare: `${Number(segment.revenue_share || 0).toLocaleString('fr-FR')} %`,
                    conversionRate: `${Number(segment.conversion_rate || 0).toLocaleString('fr-FR')} %`,
                    recommendation: String(segment.recommendation || ''),
                    action: String(segment.action || '')
                })));

                this.marketingCustomers.set(customers.slice(0, 8).map((customer: any) => ({
                    name: String(customer.name || 'Client'),
                    source: String(customer.source || 'Sales'),
                    segment: String(customer.segment || 'Segment'),
                    color: String(customer.color || '#2563eb'),
                    score: Number(customer.score || 0),
                    revenue: this.formatMoney(customer.ca_total),
                    orders: Number(customer.nb_commandes || 0),
                    quotes: Number(customer.nb_devis || 0),
                    action: String(customer.action || '')
                })));

                if (customers.length || segments.length) {
                    this.pushPulse(
                        'Marketing Intelligence',
                        `${customers.length} profils analyses, ${segments.length} segments detectes depuis Sales${summary.crm_status === 'ok' ? ' et CRM' : ''}.`,
                        'success'
                    );
                }
            },
            error: () => {
                this.pushPulse('Marketing Intelligence', 'La segmentation marketing est temporairement indisponible.', 'warning');
            }
        });
    }

    loadMcpStatus(): void {
        this.ai.getMcpStatus().subscribe({
            next: (data) => {
                const connectors = data?.connectors || {};
                const email = connectors.email || {};
                const calendar = connectors.calendar || {};

                const nextConnectors: McpConnectorView[] = [
                    {
                        label: email.name || 'Email',
                        provider: email.provider || 'local-draft',
                        route: email.route || '/api/sales/ai/mcp/email/draft',
                        configured: Boolean(email.configured),
                        statusLabel: email.configured ? 'Connecte' : 'Brouillon local',
                        icon: 'fa-solid fa-envelope'
                    },
                    {
                        label: calendar.name || 'Agenda',
                        provider: calendar.provider || 'local-proposal',
                        route: calendar.route || '/api/sales/ai/mcp/calendar/event',
                        configured: Boolean(calendar.configured),
                        statusLabel: calendar.configured ? 'Connecte' : 'Proposition locale',
                        icon: 'fa-solid fa-calendar-days'
                    }
                ];

                this.mcpConnectors.set(nextConnectors);
                const active = nextConnectors.filter((connector) => connector.configured);
                this.pushPulse(
                    'Connecteurs MCP',
                    active.length
                        ? `${active.map((connector) => connector.label).join(', ')} connecte(s) au bridge MCP.`
                        : 'Email et Agenda sont prets en mode local. Configurez les URLs MCP pour activer la connexion externe.',
                    active.length ? 'success' : 'info'
                );
            },
            error: () => {
                this.pushPulse('Connecteurs MCP', 'Etat MCP indisponible pour le moment.', 'warning');
            }
        });
    }

    submitCommand(): void {
        const q = this.commandQuery.trim();
        if (!q || this.commandBusy()) return;

        this.commandBusy.set(true);
        this.ai.chat(q).subscribe({
            next: (res) => {
                const answer = res?.reponse || res?.response || 'Copilot a repondu sans contenu.';
                this.pushPulse('MAKA Copilot', answer, 'info');
            },
            error: () => {
                this.pushPulse('MAKA Copilot', 'Le service IA est indisponible. Reessayez apres le rebuild du backend.', 'warning');
            },
            complete: () => {
                this.commandBusy.set(false);
                this.commandQuery = '';
            }
        });
    }

    prepareEmailDraft(): void {
        if (this.emailBusy()) return;

        const metrics = this.quickMetrics();
        const alert = this.spotlightAlerts()[0];
        const subject = alert?.title ? `[MAKA Intelligence] ${alert.title}` : '[MAKA Intelligence] Synthese automatique';
        const body = [
            'Bonjour,',
            '',
            'Voici une synthese generee par MAKA Intelligence :',
            `- Sante entreprise : ${this.healthLabel()} (${this.healthScore()}/100)`,
            ...metrics.map((metric) => `- ${metric.label} : ${metric.value}${metric.delta ? ` (${metric.delta})` : ''}`),
            alert?.title ? `- Alerte prioritaire ${alert.module} : ${alert.title}` : '',
            '',
            'Cordialement,',
            'MAKA Intelligence'
        ].filter(Boolean).join('\n');

        this.emailBusy.set(true);
        this.ai.createEmailDraft({
            to: [],
            subject,
            body,
            context: 'MAKA Intelligence'
        }).subscribe({
            next: (res) => {
                const draftSubject = res?.draft?.subject || subject;
                const provider = res?.provider || 'local-draft';
                this.pushPulse(
                    'Email MCP',
                    `Brouillon prepare avec ${provider} : ${draftSubject}`,
                    res?.connected ? 'success' : 'info'
                );
            },
            error: () => {
                this.pushPulse('Email MCP', 'Impossible de preparer le brouillon email.', 'warning');
            },
            complete: () => {
                this.emailBusy.set(false);
            }
        });
    }

    onCommandKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.submitCommand();
        }
    }

    barHeight(value: number): number {
        if (!value) return 0;
        return Math.round((value / this.maxForecastBar()) * 100);
    }

    pulseRowClass(ev: PulseAiEvent): string {
        return `intel-pulse__row intel-pulse__row--${ev.tone}`;
    }

    mcpStatusClass(connector: McpConnectorView): string {
        return connector.configured ? 'intel-mcp__badge intel-mcp__badge--on' : 'intel-mcp__badge';
    }

    private formatMoney(value: unknown): string {
        return `${Number(value || 0).toLocaleString('fr-FR')} MAD`;
    }

    private marketingCrmLabel(status: unknown): string {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'ok') return 'CRM connecte';
        if (normalized === 'auth_required') return 'CRM avec session requise';
        if (normalized === 'unavailable') return 'CRM indisponible';
        return 'Mode Sales';
    }

    private pushPulse(label: string, detail: string, tone: PulseAiEvent['tone']): void {
        this.pulseEvents.update((list) => [
            {
                id: `ai-${Date.now()}`,
                label,
                detail: detail.length > 220 ? detail.slice(0, 220) + '...' : detail,
                timeLabel: 'Maintenant',
                tone,
                icon: tone === 'warning' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-brain'
            },
            ...list
        ]);
    }

    private alertSeverity(type: string | undefined): 'low' | 'med' | 'high' {
        const normalized = String(type || '').toLowerCase();
        if (normalized === 'danger' || normalized === 'error' || normalized === 'critical') return 'high';
        if (normalized === 'warning') return 'med';
        return 'low';
    }
}
