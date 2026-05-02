import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepteur auth : `withCredentials: true` pour envoyer le cookie HttpOnly `maka_jwt`
 * vers la gateway. Si le backend a aussi renvoyé `token` au login (stocké par compatibilité),
 * on ajoute `Authorization: Bearer` pour les services qui lisent le header (CRM .NET, Finance).
 */
export const authInterceptor: HttpInterceptorFn = function (req, next) {
    const token = localStorage.getItem('maka_token');

    let cloned = req.clone({ withCredentials: true });

    if (token) {
        cloned = cloned.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(cloned);
};
