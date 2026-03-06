import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

// composant de la page de connexion
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {

    // champs du formulaire
    email = '';
    password = '';

    // messages d'etat
    erreur = '';
    loading = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        public themeSvc: ThemeService
    ) { }

    // changer de theme (sombre/clair)
    toggleTheme(): void {
        this.themeSvc.toggle();
    }

    // quand l'utilisateur clique sur "Se connecter"
    onLogin(): void {
        this.loading = true;
        this.erreur = '';

        // on appelle le service d'authentification
        this.auth.login({ email: this.email, password: this.password }).subscribe({
            // si la connexion reussit, on redirige vers le dashboard
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            // si la connexion echoue, on affiche l'erreur
            error: (err: any) => {
                this.erreur = err.error?.message || err.error?.error || 'Email ou mot de passe incorrect.';
                this.loading = false;
            }
        });
    }
}
