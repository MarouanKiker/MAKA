import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// intercepteur HTTP : il ajoute automatiquement le token JWT
// dans les headers de chaque requete envoyee au backend
// comme ca on n'a pas a le faire manuellement a chaque appel
export const authInterceptor: HttpInterceptorFn = function (req, next) {
    // recuperer le token depuis le service d'authentification
    let auth = inject(AuthService);
    let router = inject(Router);
    let token = auth.getToken();

    // si on a un token, on l'ajoute dans le header Authorization
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: 'Bearer ' + token
            }
        });
    }

    // on continue la requete et on gère les erreurs
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expiré ou invalide : on déconnecte et on redirige
                auth.logout();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
