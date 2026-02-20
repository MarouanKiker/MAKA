import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// service qui gere l'authentification (connexion, inscription, deconnexion)
@Injectable({ providedIn: 'root' })
export class AuthService {

    // url de l'api d'authentification
    private api = environment.authApiUrl;

    // si true : on utilise des comptes de test sans backend
    // si false : on envoie les requetes au vrai backend
    private mockMode = true;

    constructor(private http: HttpClient, private router: Router) { }

    // connexion d'un utilisateur
    login(data: LoginRequest): Observable<TokenResponse> {
        // si on est en mode test, on utilise les comptes locaux
        if (this.mockMode) {
            return this.mockLogin(data);
        }
        // sinon on appelle le vrai backend
        return this.http.post<TokenResponse>(this.api + '/login', data).pipe(
            tap((res: TokenResponse) => { this.saveSession(res); })
        );
    }

    // inscription d'un nouvel utilisateur
    register(data: RegisterRequest): Observable<any> {
        if (this.mockMode) {
            return this.mockRegister(data);
        }
        return this.http.post(this.api + '/register', data);
    }

    // deconnexion : on supprime le token et on redirige vers login
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    // verifier si l'utilisateur est connecte
    isLoggedIn(): boolean {
        let token = localStorage.getItem('token');
        if (token) {
            return true;
        }
        return false;
    }

    // recuperer les infos de l'utilisateur connecte
    getUser(): User | null {
        let raw = localStorage.getItem('user');
        if (raw) {
            return JSON.parse(raw);
        }
        return null;
    }

    // recuperer le token JWT
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    // sauvegarder la session apres une connexion reussie
    private saveSession(res: TokenResponse): void {
        // on stocke le token
        localStorage.setItem('token', res.access_token);

        // on decode le token pour recuperer les infos du user
        let parts = res.access_token.split('.');
        let payload = JSON.parse(atob(parts[1]));

        // on cree l'objet utilisateur
        let user: User = {
            id: payload.id,
            nom: payload.nom,
            prenom: payload.prenom,
            email: payload.email,
            roles: payload.roles
        };

        // on stocke le user dans le localStorage
        localStorage.setItem('user', JSON.stringify(user));
    }

    // --- simulation de login sans backend ---
    private mockLogin(data: LoginRequest): Observable<TokenResponse> {
        // liste des comptes de test
        let users = [
            { id: 1, email: 'admin@maka.com', password: 'admin123', nom: 'Kiker', prenom: 'Marwan', roles: ['ROLE_ADMIN'] },
            { id: 2, email: 'commercial@maka.com', password: 'test123', nom: 'Ajebli', prenom: 'Abdellah', roles: ['ROLE_COMMERCIAL'] },
            { id: 3, email: 'support@maka.com', password: 'test123', nom: 'Missaoui', prenom: 'Abderahmane', roles: ['ROLE_SUPPORT'] }
        ];

        // chercher le compte qui correspond
        let found = null;
        for (let i = 0; i < users.length; i++) {
            if (users[i].email === data.email && users[i].password === data.password) {
                found = users[i];
                break;
            }
        }

        // si aucun compte trouve, on renvoie une erreur
        if (!found) {
            return throwError(() => ({ error: { error: 'Email ou mot de passe incorrect.' } })).pipe(delay(500));
        }

        // generer un faux token JWT
        let payloadStr = btoa(JSON.stringify({
            id: found.id,
            nom: found.nom,
            prenom: found.prenom,
            email: found.email,
            roles: found.roles,
            exp: Math.floor(Date.now() / 1000) + 3600
        }));
        let fakeToken = 'eyJhbGciOiJSUzI1NiJ9.' + payloadStr + '.fakesignature';

        // creer la reponse
        let response: TokenResponse = {
            access_token: fakeToken,
            refresh_token: 'fake-refresh',
            expires_in: 3600,
            token_type: 'Bearer'
        };

        // retourner la reponse avec un delai de 500ms pour simuler le reseau
        return of(response).pipe(
            delay(500),
            tap((res: TokenResponse) => { this.saveSession(res); })
        );
    }

    // --- simulation d'inscription sans backend ---
    private mockRegister(data: RegisterRequest): Observable<any> {
        // verifier que tous les champs sont remplis
        if (!data.email || !data.password || !data.nom || !data.prenom) {
            return throwError(() => ({ error: { error: 'Tous les champs sont obligatoires.' } })).pipe(delay(500));
        }
        // simuler une reponse de succes
        return of({ message: 'Compte cree avec succes' }).pipe(delay(500));
    }
}
