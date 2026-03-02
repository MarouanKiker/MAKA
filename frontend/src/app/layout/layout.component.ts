import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
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

    // liens du menu avec leurs icones SVG
    menuItems = [
        {
            path: '/dashboard', label: 'Tableau de bord', color: '#4a9eff',
            svg: 'M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z'
        },
        {
            path: '/accounts', label: 'Comptes', color: '#36c5b8',
            svg: 'M4 4h12v2H4V4zm0 4h12v8H4V8zm2 2v4h3v-4H6zm5 0v4h3v-4h-3z'
        },
        {
            path: '/contacts', label: 'Contacts', color: '#9370ff',
            svg: 'M10 4a3 3 0 100 6 3 3 0 000-6zM4 16c0-2.7 4-4 6-4s6 1.3 6 4v1H4v-1z'
        },
        {
            path: '/leads', label: 'Leads', color: '#f5c748',
            svg: 'M10 2l2.4 4.8L18 7.6l-4 3.9.9 5.5L10 14.5 5.1 17l.9-5.5-4-3.9 5.6-.8L10 2z'
        },
        {
            path: '/opportunities', label: 'Opportunites', color: '#44d492',
            svg: 'M10 2v4m0 8v4m8-8h-4M6 10H2m13.1-5.1l-2.8 2.8M7.7 12.3l-2.8 2.8m11.4 0l-2.8-2.8M7.7 7.7L4.9 4.9'
        },
        {
            path: '/tasks', label: 'Taches', color: '#e88554',
            svg: 'M4 5h12M4 5l2 2 3-3M4 10h12M4 10l2 2 3-3M4 15h12M4 15l2 2 3-3'
        },
        {
            path: '/tickets', label: 'Tickets', color: '#f06c62',
            svg: 'M4 4h12a1 1 0 011 1v2a2 2 0 100 4v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a2 2 0 100-4V5a1 1 0 011-1z'
        },
        {
            path: '/campaigns', label: 'Campagnes', color: '#e664a0',
            svg: 'M3 8l4-4v3h6V5l4 5-4 5v-3H7v2L3 8z'
        },
    ];

    constructor(
        private auth: AuthService,
        public themeSvc: ThemeService
    ) {
        // recuperer les infos de l'utilisateur connecte
        this.user = this.auth.getUser();

        // si l'ecran est petit, fermer la sidebar par defaut
        if (window.innerWidth < 768) {
            this.sidebarOpen = false;
        }
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
