import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Intercepteur auth : `withCredentials: true` pour envoyer le cookie HttpOnly `maka_jwt`
 * vers la gateway. Si le backend a aussi renvoyé `token` au login (stocké par compatibilité),
 * on ajoute `Authorization: Bearer` pour les services qui lisent le header (CRM .NET, Finance).
 */
export const authInterceptor: HttpInterceptorFn = function (req, next) {
    const auth = inject(AuthService);
    const router = inject(Router);
    const token = localStorage.getItem('maka_token');

    let cloned = req.clone({ withCredentials: true });

    if (token) {
        cloned = cloned.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(cloned).pipe(
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
