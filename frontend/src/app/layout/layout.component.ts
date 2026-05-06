import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { User } from '../core/models/auth.model';

// layout principal : sidebar + topbar + contenu
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent {

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
        // --- GESTION DES STOCKS ---
        {
            path: '/stock', label: 'Stocks', color: '#14b8a6',
            icon: 'fa-solid fa-boxes-stacked', roles: ['ROLE_COMMERCIAL', 'ROLE_ADMIN', 'ROLE_SUPPORT']
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

    // Nouveaux états UI
    showNotifPanel = false;
    showUserMenu = false;
    showSearch = false;
    searchQuery = '';

    mockNotifications = [
        { icon: 'fa-solid fa-file-invoice', color: 'text-emerald-500', title: 'Nouvelle facture', text: 'La facture FAC-2026-003 a été réglée.', time: 'Il y a 5 min' },
        { icon: 'fa-solid fa-plane-departure', color: 'text-rose-500', title: 'Demande de congé', text: 'Marouan a demandé des congés.', time: 'Il y a 2 heures' },
        { icon: 'fa-solid fa-shield-halved', color: 'text-amber-500', title: 'Sécurité système', text: 'Mise à jour réussie des habilitations.', time: 'Hier' }
    ];

    constructor(
        private auth: AuthService,
        public themeSvc: ThemeService,
        private router: Router
    ) {
        // recup infos utilisateur co
        this.user = this.auth.getUser();

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            const url = event.urlAfterRedirects || event.url;
            this.isHub = url === '/dashboard';
            
            // detect quel module est actif
            if (url.includes('/leads') || url.includes('/opportunities') || url.includes('/campaigns') || url.includes('/tasks')) {
                this.currentModule = 'CRM';
            } else if (url.includes('/tickets')) {
                this.currentModule = 'SUPPORT';
            } else if (url.includes('/stock')) {
                this.currentModule = 'STOCK';
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

        // sidebar fermee par defaut sur mobile
        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
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

            if (this.currentModule === 'STOCK' && !['/dashboard', '/stock'].includes(item.path)) return false;

            if (this.currentModule === 'HR' && !['/espace-employe', '/hr-employes', '/hr-contrats', '/hr-conges', '/hr-paie', '/hr-reclamations'].includes(item.path)) return false;

            if (this.currentModule === 'ADMIN' && !['/dashboard', '/admin'].includes(item.path)) return false;

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
        if (this.searchQuery) {
            this.toastMessage = `Recherche en cours pour "${this.searchQuery}"...`;
            setTimeout(() => {
                this.toastMessage = 'Aucun résultat trouvé pour cette recherche.';
                setTimeout(() => this.toastMessage = '', 3000);
            }, 1000);
        }
    }
}
