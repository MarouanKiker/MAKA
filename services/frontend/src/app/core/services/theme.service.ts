import { Injectable } from '@angular/core';

// service qui gere le theme (mode sombre / mode clair)
// le choix est sauvegarde dans le localStorage du navigateur
@Injectable({ providedIn: 'root' })
export class ThemeService {

    // le theme actuel (dark ou light)
    private theme = 'dark';

    constructor() {
        // au demarrage, on recupere le theme sauvegarde
        let saved = localStorage.getItem('theme');
        if (saved) {
            this.theme = saved;
        }
        // on applique le theme sur la page
        this.applyTheme();
    }

    // changer de theme (dark <-> light)
    toggle(): void {
        if (this.theme === 'dark') {
            this.theme = 'light';
        } else {
            this.theme = 'dark';
        }
        // sauvegarder le choix
        localStorage.setItem('theme', this.theme);
        // appliquer le changement
        this.applyTheme();
    }

    // verifier si on est en mode sombre
    isDark(): boolean {
        return this.theme === 'dark';
    }

    // appliquer le theme sur le body de la page
    private applyTheme(): void {
        document.body.setAttribute('data-theme', this.theme);
    }
}
