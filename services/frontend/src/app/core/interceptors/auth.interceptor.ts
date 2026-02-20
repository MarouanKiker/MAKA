import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// intercepteur HTTP : il ajoute automatiquement le token JWT
// dans les headers de chaque requete envoyee au backend
// comme ca on n'a pas a le faire manuellement a chaque appel
export const authInterceptor: HttpInterceptorFn = function (req, next) {
    // recuperer le token depuis le service d'authentification
    let auth = inject(AuthService);
    let token = auth.getToken();

    // si on a un token, on l'ajoute dans le header Authorization
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: 'Bearer ' + token
            }
        });
    }

    // on continue la requete
    return next(req);
};
