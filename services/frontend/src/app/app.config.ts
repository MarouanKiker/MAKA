import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// configuration principale de l'application Angular
// on declare ici les providers (services globaux)
export const appConfig: ApplicationConfig = {
  providers: [
    // le router gere la navigation entre les pages
    provideRouter(routes),
    // le client HTTP avec notre intercepteur qui ajoute le token
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
