import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

// composant de la page d'inscription
@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {

    // champs du formulaire
    nom = '';
    prenom = '';
    email = '';
    password = '';

    // messages
    erreur = '';
    succes = '';
    loading = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        public themeSvc: ThemeService
    ) { }

    // changer de theme
    toggleTheme(): void {
        this.themeSvc.toggle();
    }

    // quand l'utilisateur clique sur "Creer mon compte"
    onRegister(): void {
        this.loading = true;
        this.erreur = '';
        this.succes = '';

        // on envoie les donnees au service d'authentification
        let data = {
            nom: this.nom,
            prenom: this.prenom,
            email: this.email,
            password: this.password
        };

        this.auth.register(data).subscribe({
            // si l'inscription reussit
            next: () => {
                this.succes = 'Compte cree ! Redirection...';
                // on attend 1 seconde et on redirige vers login
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 1000);
            },
            // si l'inscription echoue
            error: (err: any) => {
                this.erreur = err.error?.error || 'Erreur lors de l\'inscription';
                this.loading = false;
            }
        });
    }
}
