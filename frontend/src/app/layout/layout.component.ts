import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { User } from '../core/models/auth.model';

// composant principal du layout (sidebar + topbar + contenu)
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent {

    // utilisateur connecte
    user: User | null;

    // sidebar ouverte ou fermee
    sidebarOpen = true;

    // liens du menu avec leurs icones Font Awesome
    allMenuItems = [
        {
            path: '/dashboard', label: 'Hub Principal', color: '#818cf8',
            icon: 'fa-solid fa-house', roles: ['ROLE_EMPLOYE', 'ROLE_USER']
        },
        {
            path: '/accounts', label: 'Comptes', color: '#60a5fa',
            icon: 'fa-solid fa-building', roles: ['ROLE_COMMERCIAL', 'ROLE_SUPPORT']
        },
        {
            path: '/contacts', label: 'Contacts', color: '#a78bfa',
            icon: 'fa-solid fa-address-book', roles: ['ROLE_COMMERCIAL', 'ROLE_SUPPORT']
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
            icon: 'fa-solid fa-brain', roles: ['ROLE_EMPLOYE', 'ROLE_USER'] // tout le monde
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
        // --- ADMIN ---
        {
            path: '/admin', label: 'Administration', color: '#fbbf24',
            icon: 'fa-solid fa-users-gear', roles: ['ROLE_ADMIN']
        },
    ];

    menuItems: any[] = [];

    isHub = false;
    currentModule = '';

    constructor(
        private auth: AuthService,
        public themeSvc: ThemeService,
        private router: Router
    ) {
        // recuperer les infos de l'utilisateur connecte
        this.user = this.auth.getUser();

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            const url = event.urlAfterRedirects || event.url;
            this.isHub = url === '/dashboard';
            
            // Determine current module
            if (url.includes('/accounts') || url.includes('/contacts') || url.includes('/leads') || url.includes('/opportunities') || url.includes('/campaigns') || url.includes('/tasks')) {
                this.currentModule = 'CRM';
            } else if (url.includes('/tickets')) {
                this.currentModule = 'SUPPORT';
            } else if (url.includes('/intelligence')) {
                this.currentModule = 'IA';
            } else if (url.includes('/factures') || url.includes('/paiements') || url.includes('/comptes-bancaires') || url.includes('/journal')) {
                this.currentModule = 'FINANCE';
            } else if (url.includes('/admin')) {
                this.currentModule = 'ADMIN';
            } else {
                this.currentModule = '';
            }

            this.updateMenu();
        });

        // si l'ecran est petit, fermer la sidebar par defaut
        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
    }

    updateMenu(): void {
        this.menuItems = this.allMenuItems.filter(item => {
            // Check roles
            const hasRole = this.auth.isAdmin() || item.roles.some((r: string) => this.auth.hasRole(r) || r === 'ROLE_EMPLOYE');
            if (!hasRole) return false;

            // Check module logic
            if (this.currentModule === 'CRM' && !['/dashboard', '/accounts', '/contacts', '/leads', '/opportunities', '/campaigns', '/tasks', '/tickets'].includes(item.path)) return false;
            
            if (this.currentModule === 'IA' && !['/dashboard', '/intelligence'].includes(item.path)) return false;
            
            if (this.currentModule === 'FINANCE' && !['/dashboard', '/factures', '/paiements', '/comptes-bancaires', '/journal'].includes(item.path)) return false;

            if (this.currentModule === 'ADMIN' && !['/dashboard', '/admin'].includes(item.path)) return false;

            return true;
        });
    }

    // detecter le redimensionnement de la fenetre
    @HostListener('window:resize')
    onResize(): void {
        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
    }

    // ouvrir/fermer la sidebar
    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    // changer de theme
    toggleTheme(): void {
        this.themeSvc.toggle();
    }

    // se deconnecter
    logout(): void {
        this.auth.logout();
    }
}
