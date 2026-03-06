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

    // liens du menu avec leurs icones Font Awesome
    menuItems = [
        {
            path: '/dashboard', label: 'Tableau de bord', color: '#818cf8',
            icon: 'fa-solid fa-gauge-high'
        },
        {
            path: '/accounts', label: 'Comptes', color: '#60a5fa',
            icon: 'fa-solid fa-building'
        },
        {
            path: '/contacts', label: 'Contacts', color: '#a78bfa',
            icon: 'fa-solid fa-address-book'
        },
        {
            path: '/leads', label: 'Leads', color: '#fbbf24',
            icon: 'fa-solid fa-bullseye'
        },
        {
            path: '/opportunities', label: 'Opportunites', color: '#34d399',
            icon: 'fa-solid fa-arrow-trend-up'
        },
        {
            path: '/tasks', label: 'Taches', color: '#fb923c',
            icon: 'fa-solid fa-list-check'
        },
        {
            path: '/tickets', label: 'Tickets', color: '#f87171',
            icon: 'fa-solid fa-ticket'
        },
        {
            path: '/campaigns', label: 'Campagnes', color: '#f472b6',
            icon: 'fa-solid fa-bullhorn'
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
