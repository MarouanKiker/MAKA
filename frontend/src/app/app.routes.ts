import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

// definition de toutes les routes de l'application
export const routes: Routes = [

    // --- pages publiques (pas besoin d'etre connecte) ---

    // page de connexion
    {
        path: 'login',
        loadComponent: function () {
            return import('./pages/login/login.component').then(function (m) {
                return m.LoginComponent;
            });
        },
        canActivate: [guestGuard]
    },

    // page d'inscription
    {
        path: 'register',
        loadComponent: function () {
            return import('./pages/register/register.component').then(function (m) {
                return m.RegisterComponent;
            });
        },
        canActivate: [guestGuard]
    },

    // --- pages protegees (avec la sidebar) ---
    // toutes ces pages sont des enfants du LayoutComponent
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            // tableau de bord
            {
                path: 'dashboard',
                loadComponent: function () {
                    return import('./pages/dashboard/dashboard.component').then(function (m) {
                        return m.DashboardComponent;
                    });
                }
            },
            // gestion des comptes
            {
                path: 'accounts',
                loadComponent: function () {
                    return import('./pages/accounts/accounts.component').then(function (m) {
                        return m.AccountsComponent;
                    });
                }
            },
            // gestion des contacts
            {
                path: 'contacts',
                loadComponent: function () {
                    return import('./pages/contacts/contacts.component').then(function (m) {
                        return m.ContactsComponent;
                    });
                }
            },
            // gestion des leads
            {
                path: 'leads',
                loadComponent: function () {
                    return import('./pages/leads/leads.component').then(function (m) {
                        return m.LeadsComponent;
                    });
                }
            },
            // gestion des opportunites
            {
                path: 'opportunities',
                loadComponent: function () {
                    return import('./pages/opportunities/opportunities.component').then(function (m) {
                        return m.OpportunitiesComponent;
                    });
                }
            },
            // gestion des taches
            {
                path: 'tasks',
                loadComponent: function () {
                    return import('./pages/tasks/tasks.component').then(function (m) {
                        return m.TasksComponent;
                    });
                }
            },
            // gestion des tickets
            {
                path: 'tickets',
                loadComponent: function () {
                    return import('./pages/tickets/tickets.component').then(function (m) {
                        return m.TicketsComponent;
                    });
                }
            },
            // gestion des campagnes
            {
                path: 'campaigns',
                loadComponent: function () {
                    return import('./pages/campaigns/campaigns.component').then(function (m) {
                        return m.CampaignsComponent;
                    });
                }
            },
            // redirection par defaut vers le dashboard
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },

    // si l'url n'existe pas, on redirige vers login
    { path: '**', redirectTo: 'login' }
];
