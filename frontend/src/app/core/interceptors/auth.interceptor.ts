import { HttpInterceptorFn } from '@angular/common/http';

// intercepteur HTTP : envoie automatiquement les cookies HttpOnly (maka_jwt).
export const authInterceptor: HttpInterceptorFn = function (req, next) {
    req = req.clone({ withCredentials: true });

    // on continue la requete
    return next(req);
};
