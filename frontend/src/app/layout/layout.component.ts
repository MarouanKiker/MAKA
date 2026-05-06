import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { forkJoin, Subscription, interval } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { CrmService } from '../core/services/crm.service';
import { FinanceService } from '../core/services/finance.service';
import { HrService } from '../core/services/hr.service';
import { User } from '../core/models/auth.model';

export interface LiveNotification {
    icon: string;
    color: string;
    title: string;
    text: string;
    time: string;
    route?: string;
    read: boolean;
}

export interface SearchResult {
    icon: string;
    color: string;
    label: string;
    detail: string;
    route: string;
}

// layout principal : sidebar + topbar + contenu
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {

    private refreshSub?: Subscription;

    // utilisateur connecte
    user: User | null;

    // sidebar ouverte/fermee
    sidebarOpen = true;

    // liens du menu lateral
    allMenuItems = [
        {
            path: '/dashboard', label: 'Hub Principal', color: '#818cf8',
            icon: 'fa-solid fa-house', roles: ['ROLE_EMPLOYE', 'ROLE_USER']
        },
        {
            path: '/leads', label: 'Leads', color: '#fbbf24',
            icon: 'fa-solid fa-bullseye', roles: ['ROLE_COMMERCIAL']
        },
        {
            path: '/opportunities', label: 'Opportunites', color: '#34d399',
            icon: 'fa-solid fa-arrow-trend-up', roles: ['ROLE_COMMERCIAL']
        },
        {
            path: '/tasks', label: 'Taches', color: '#fb923c',
            icon: 'fa-solid fa-list-check', roles: ['ROLE_COMMERCIAL', 'ROLE_SUPPORT', 'ROLE_FINANCIER']
        },
        {
            path: '/tickets', label: 'Tickets', color: '#f87171',
            icon: 'fa-solid fa-ticket', roles: ['ROLE_SUPPORT']
        },
        {
            path: '/campaigns', label: 'Campagnes', color: '#f472b6',
            icon: 'fa-solid fa-bullhorn', roles: ['ROLE_COMMERCIAL']
        },
        {
            path: '/intelligence', label: 'MAKA Intelligence', color: '#22d3ee',
            icon: 'fa-solid fa-brain', roles: ['ROLE_EMPLOYE', 'ROLE_USER'] // visible par tous
        },
        // --- FINANCES ---
        {
            path: '/factures', label: 'Factures', color: '#10b981',
            icon: 'fa-solid fa-file-invoice-dollar', roles: ['ROLE_FINANCIER', 'ROLE_ADMIN']
        },
        {
            path: '/paiements', label: 'Paiements', color: '#34d399',
            icon: 'fa-solid fa-money-bill-transfer', roles: ['ROLE_FINANCIER', 'ROLE_ADMIN']
        },
        {
            path: '/comptes-bancaires', label: 'Comptes', color: '#059669',
            icon: 'fa-solid fa-building-columns', roles: ['ROLE_FINANCIER', 'ROLE_ADMIN']
        },
        {
            path: '/journal', label: 'Journal Comptable', color: '#6ee7b7',
            icon: 'fa-solid fa-book-journal-whills', roles: ['ROLE_FINANCIER', 'ROLE_ADMIN']
        },
        // --- RESSOURCES HUMAINES ---
        {
            path: '/espace-employe', label: 'Espace Employé', color: '#10b981',
            icon: 'fa-solid fa-user-tie', roles: ['ROLE_EMPLOYE', 'ROLE_RH', 'ROLE_ADMIN']
        },
        {
            path: '/hr-employes', label: 'Employés', color: '#ec4899',
            icon: 'fa-solid fa-users', roles: ['ROLE_RH', 'ROLE_ADMIN']
        },
        {
            path: '/hr-contrats', label: 'Contrats', color: '#d946ef',
            icon: 'fa-solid fa-file-contract', roles: ['ROLE_RH', 'ROLE_ADMIN']
        },
        {
            path: '/hr-conges', label: 'Congés', color: '#f472b6',
            icon: 'fa-solid fa-calendar-check', roles: ['ROLE_RH', 'ROLE_ADMIN']
        },
        {
            path: '/hr-paie', label: 'Fiches de Paie', color: '#be185d',
            icon: 'fa-solid fa-money-check-dollar', roles: ['ROLE_RH', 'ROLE_ADMIN']
        },
        {
            path: '/hr-reclamations', label: 'Réclamations', color: '#fb7185',
            icon: 'fa-solid fa-comment-dots', roles: ['ROLE_RH', 'ROLE_ADMIN']
        },
        // --- ADMIN ---
        {
            path: '/admin', label: 'Administration', color: '#fbbf24',
            icon: 'fa-solid fa-users-gear', roles: ['ROLE_ADMIN']
        },
    ];

    menuItems: any[] = [];

    isHub = false;
    currentModule = '';
    toastMessage = '';

    // Live notifications from real backend data
    showNotifPanel = false;
    showUserMenu = false;
    showSearch = false;
    searchQuery = '';
    notifications: LiveNotification[] = [];
    unreadCount = 0;

    // Search results
    searchResults: SearchResult[] = [];
    searchLoading = false;
    allSearchableItems: SearchResult[] = [];

    constructor(
        private auth: AuthService,
        public themeSvc: ThemeService,
        private router: Router,
        private crmService: CrmService,
        private financeService: FinanceService,
        private hrService: HrService
    ) {
        this.user = this.auth.getUser();

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            const url = event.urlAfterRedirects || event.url;
            this.isHub = url === '/dashboard';
            
            if (url.includes('/leads') || url.includes('/opportunities') || url.includes('/campaigns') || url.includes('/tasks')) {
                this.currentModule = 'CRM';
            } else if (url.includes('/tickets')) {
                this.currentModule = 'SUPPORT';
            } else if (url.includes('/intelligence')) {
                this.currentModule = 'IA';
            } else if (url.includes('/factures') || url.includes('/paiements') || url.includes('/comptes-bancaires') || url.includes('/journal')) {
                this.currentModule = 'FINANCE';
            } else if (url.includes('/espace-employe') || url.includes('/hr-employes') || url.includes('/hr-contrats') || url.includes('/hr-conges') || url.includes('/hr-paie') || url.includes('/hr-reclamations')) {
                this.currentModule = 'HR';
            } else if (url.includes('/admin')) {
                this.currentModule = 'ADMIN';
            } else {
                this.currentModule = '';
            }

            this.updateMenu();
        });

        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
    }

    ngOnInit(): void {
        this.loadNotifications();
        this.loadSearchIndex();
        // Refresh notifications every 60 seconds
        this.refreshSub = interval(60000).subscribe(() => this.loadNotifications());
    }

    ngOnDestroy(): void {
        this.refreshSub?.unsubscribe();
    }

    // Fetch LIVE notifications from all backend services
    loadNotifications(): void {
        const notifs: LiveNotification[] = [];

        // Fetch tickets, factures, congés in parallel
        forkJoin({
            tickets: this.crmService.getTickets(),
            factures: this.financeService.getFactures(),
            conges: this.hrService.getDemandesConge()
        }).subscribe({
            next: (data) => {
                // Tickets ouverts
                const openTickets = (data.tickets || []).filter((t: any) =>
                    ['Open', 'OPEN', 'Nouveau', 'NOUVEAU', 'Pending'].includes(t.status || t.statut || '')
                );
                if (openTickets.length > 0) {
                    notifs.push({
                        icon: 'fa-solid fa-ticket', color: 'text-rose-500',
                        title: `${openTickets.length} ticket${openTickets.length > 1 ? 's' : ''} ouvert${openTickets.length > 1 ? 's' : ''}`,
                        text: openTickets.length > 0 ? `Dernier : ${openTickets[0].title || 'Sans titre'}` : '',
                        time: 'En cours', route: '/tickets', read: false
                    });
                }

                // Factures impayées
                const impayees = (data.factures || []).filter((f: any) =>
                    !['PAYEE', 'PAYÉE', 'ANNULEE'].includes(f.statut || '')
                );
                if (impayees.length > 0) {
                    const totalDu = impayees.reduce((s: number, f: any) => s + (f.resteAPayer || 0), 0);
                    notifs.push({
                        icon: 'fa-solid fa-file-invoice-dollar', color: 'text-amber-500',
                        title: `${impayees.length} facture${impayees.length > 1 ? 's' : ''} impayée${impayees.length > 1 ? 's' : ''}`,
                        text: `Montant total dû : ${totalDu.toLocaleString('fr-FR')} MAD`,
                        time: 'Finance', route: '/factures', read: false
                    });
                }

                // Congés en attente
                const enAttente = (data.conges || []).filter((c: any) =>
                    ['EnAttente', 'EN_ATTENTE', 'Pending'].includes(c.etat || c.statut || '')
                );
                if (enAttente.length > 0) {
                    notifs.push({
                        icon: 'fa-solid fa-calendar-check', color: 'text-cyan-500',
                        title: `${enAttente.length} demande${enAttente.length > 1 ? 's' : ''} de congé`,
                        text: 'En attente de validation',
                        time: 'RH', route: '/hr-conges', read: false
                    });
                }

                // Factures payées récemment (bonne nouvelle)
                const payees = (data.factures || []).filter((f: any) => f.statut === 'PAYEE');
                if (payees.length > 0) {
                    notifs.push({
                        icon: 'fa-solid fa-circle-check', color: 'text-emerald-500',
                        title: `${payees.length} facture${payees.length > 1 ? 's' : ''} réglée${payees.length > 1 ? 's' : ''}`,
                        text: 'Paiements confirmés',
                        time: 'Finance', route: '/paiements', read: true
                    });
                }

                this.notifications = notifs;
                this.unreadCount = notifs.filter(n => !n.read).length;
            },
            error: () => {
                // Fallback si les services sont down
                this.notifications = [{
                    icon: 'fa-solid fa-circle-info', color: 'text-slate-400',
                    title: 'Services en cours de chargement',
                    text: 'Les notifications seront disponibles sous peu.',
                    time: '', read: true
                }];
                this.unreadCount = 0;
            }
        });
    }

    // Build searchable index from real data
    loadSearchIndex(): void {
        // Static navigation items
        this.allSearchableItems = [
            { icon: 'fa-solid fa-house', color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600', label: 'Hub Principal', detail: 'Dashboard principal', route: '/dashboard' },
            { icon: 'fa-solid fa-bullseye', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600', label: 'Leads', detail: 'Gestion des leads CRM', route: '/leads' },
            { icon: 'fa-solid fa-arrow-trend-up', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600', label: 'Opportunités', detail: 'Pipeline des opportunités', route: '/opportunities' },
            { icon: 'fa-solid fa-list-check', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600', label: 'Tâches', detail: 'Gestion des tâches', route: '/tasks' },
            { icon: 'fa-solid fa-ticket', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600', label: 'Tickets', detail: 'Support client', route: '/tickets' },
            { icon: 'fa-solid fa-bullhorn', color: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600', label: 'Campagnes', detail: 'Campagnes marketing', route: '/campaigns' },
            { icon: 'fa-solid fa-brain', color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600', label: 'Intelligence IA', detail: 'MAKA Intelligence — Chatbot & Analytics', route: '/intelligence' },
            { icon: 'fa-solid fa-file-invoice-dollar', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600', label: 'Factures', detail: 'Gestion des factures', route: '/factures' },
            { icon: 'fa-solid fa-money-bill-transfer', color: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600', label: 'Paiements', detail: 'Suivi des paiements', route: '/paiements' },
            { icon: 'fa-solid fa-book-journal-whills', color: 'bg-green-100 dark:bg-green-500/20 text-green-600', label: 'Journal Comptable', detail: 'Écritures comptables', route: '/journal' },
            { icon: 'fa-solid fa-users', color: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600', label: 'Employés', detail: 'Gestion du personnel RH', route: '/hr-employes' },
            { icon: 'fa-solid fa-file-contract', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600', label: 'Contrats', detail: 'Contrats de travail', route: '/hr-contrats' },
            { icon: 'fa-solid fa-calendar-check', color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600', label: 'Congés', detail: 'Demandes de congé', route: '/hr-conges' },
            { icon: 'fa-solid fa-money-check-dollar', color: 'bg-red-100 dark:bg-red-500/20 text-red-600', label: 'Fiches de Paie', detail: 'Génération des bulletins', route: '/hr-paie' },
            { icon: 'fa-solid fa-user-tie', color: 'bg-green-100 dark:bg-green-500/20 text-green-600', label: 'Mon Espace', detail: 'Espace employé self-service', route: '/espace-employe' },
            { icon: 'fa-solid fa-users-gear', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600', label: 'Administration', detail: 'Gestion des utilisateurs', route: '/admin' },
        ];
    }

    markAllRead(): void {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
    }

    goToNotif(notif: LiveNotification): void {
        notif.read = true;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.showNotifPanel = false;
        if (notif.route) this.router.navigate([notif.route]);
    }

    updateMenu(): void {
        this.menuItems = this.allMenuItems.filter(item => {
            // verif si l'utilisateur a le role requis
            const hasRole = this.auth.isAdmin() || item.roles.some((r: string) => this.auth.hasRole(r) || r === 'ROLE_EMPLOYE');
            if (!hasRole) return false;

            // le hub principal reste toujours visible
            if (item.path === '/dashboard') return true;

            // filtrer par module actif (ex: pas la compta dans le CRM)
            if (this.currentModule === 'CRM' && !['/leads', '/opportunities', '/campaigns', '/tasks'].includes(item.path)) return false;
            
            if (this.currentModule === 'SUPPORT' && !['/tickets'].includes(item.path)) return false;
            
            if (this.currentModule === 'IA' && !['/intelligence'].includes(item.path)) return false;
            
            if (this.currentModule === 'FINANCE' && !['/factures', '/paiements', '/comptes-bancaires', '/journal'].includes(item.path)) return false;

            if (this.currentModule === 'HR' && !['/espace-employe', '/hr-employes', '/hr-contrats', '/hr-conges', '/hr-paie', '/hr-reclamations'].includes(item.path)) return false;

            if (this.currentModule === 'ADMIN' && !['/admin'].includes(item.path)) return false;

            // Hide Espace Employe for Admin and RH users
            if (item.path === '/espace-employe' && (this.auth.isAdmin() || this.auth.hasRole('ROLE_RH'))) {
                return false;
            }

            return true;
        });
    }

    // si la fenetre change de taille
    @HostListener('window:resize')
    onResize(): void {
        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
    }

    // Raccourci clavier (Ctrl+K pour la recherche globale)
    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.toggleSearch();
        }
        if (event.key === 'Escape') {
            this.showSearch = false;
            this.showNotifPanel = false;
            this.showUserMenu = false;
        }
    }

    // ouvrir/fermer la sidebar
    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    // basculer theme clair/sombre
    toggleTheme(): void {
        this.themeSvc.toggle();
    }

    // deconnecter l'utilisateur
    logout(): void {
        this.auth.logout();
    }

    toggleNotifs(): void {
        this.showNotifPanel = !this.showNotifPanel;
        if (this.showNotifPanel) {
            this.showUserMenu = false;
            this.showSearch = false;
        }
    }

    toggleUserMenu(): void {
        this.showUserMenu = !this.showUserMenu;
        if (this.showUserMenu) {
            this.showNotifPanel = false;
            this.showSearch = false;
        }
    }

    toggleSearch(): void {
        this.showSearch = !this.showSearch;
        if (this.showSearch) {
            this.showNotifPanel = false;
            this.showUserMenu = false;
            // focus automatique sur l'input (simulé avec un petit délai)
            setTimeout(() => {
                const searchInput = document.getElementById('globalSearchInput');
                if (searchInput) searchInput.focus();
            }, 50);
        }
    }

    performSearch(): void {
        if (!this.searchQuery || this.searchQuery.trim().length === 0) {
            this.searchResults = [];
            return;
        }
        const q = this.searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        this.searchResults = this.allSearchableItems.filter(item =>
            item.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
            item.detail.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
        );
    }

    goToSearchResult(result: SearchResult): void {
        this.showSearch = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.router.navigate([result.route]);
    }
}
