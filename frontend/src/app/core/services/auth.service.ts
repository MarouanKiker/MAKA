import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// service qui gere l'authentification (connexion, inscription, deconnexion)
@Injectable({ providedIn: 'root' })
export class AuthService {

    // url de l'api d'authentification
    private api = environment.authApiUrl;

    constructor(private http: HttpClient, private router: Router) { }

    // connexion d'un utilisateur
    login(data: LoginRequest): Observable<TokenResponse> {
        // appel au vrai backend Symfony (LexikJWT)
        return this.http.post<any>(this.api + '/login', data).pipe(
            map((res: any) => {
                // mapper les noms de champs du backend vers le frontend
                let mapped: TokenResponse = {
                    access_token: res.token,
                    refresh_token: res.refresh_token || '',
                    expires_in: 3600,
                    token_type: 'Bearer'
                };
                return mapped;
            }),
            tap((res: TokenResponse) => { this.saveSession(res); })
        );
    }

    // inscription d'un nouvel utilisateur
    register(data: RegisterRequest): Observable<any> {
        let backendData = {
            email: data.email,
            password: data.password,
            first_name: data.prenom,
            last_name: data.nom
        };
        return this.http.post(this.api + '/register', backendData);
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

    // verifier si l'utilisateur a un role specifique
    hasRole(role: string): boolean {
        let user = this.getUser();
        if (user && user.roles) {
            return user.roles.includes(role) || user.roles.includes('ROLE_ADMIN');
        }
        return false;
    }

    // verifier si l'utilisateur est admin
    isAdmin(): boolean {
        return this.hasRole('ROLE_ADMIN');
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
        // adapter le base64url au base64 standard pour atob
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        // padding '='
        while (b64.length % 4) {
            b64 += '=';
        }
        let payload = JSON.parse(decodeURIComponent(escape(atob(b64))));

        // on cree l'objet utilisateur avec mapping des champs
        let user: User = {
            id: payload.user_id || payload.id,
            nom: payload.lastName || payload.nom || '',
            prenom: payload.firstName || payload.prenom || '',
            email: payload.email,
            roles: payload.roles
        };

        // on stocke le user dans le localStorage
        localStorage.setItem('user', JSON.stringify(user));
    }
}
