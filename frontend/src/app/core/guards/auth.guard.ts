import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// garde qui protege les pages qui necessitent une connexion
// si le user n'est pas connecte, on le redirige vers la page login
export const authGuard: CanActivateFn = function () {
    let auth = inject(AuthService);
    let router = inject(Router);

    if (auth.isLoggedIn()) {
        // l'utilisateur est connecte, on le laisse passer
        return true;
    }
    // sinon on le redirige vers la page de connexion
    router.navigate(['/login']);
    return false;
};

// garde inverse : empeche d'aller sur login/register si deja connecte
// par exemple, un user deja connecte ne doit pas revoir la page login
export const guestGuard: CanActivateFn = function () {
    let auth = inject(AuthService);
    let router = inject(Router);

    if (!auth.isLoggedIn()) {
        // l'utilisateur n'est pas connecte, il peut aller sur login
        return true;
    }
    // sinon on le redirige vers le dashboard
    router.navigate(['/dashboard']);
    return false;
};
