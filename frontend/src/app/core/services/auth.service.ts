import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

// service qui gere l'authentification (connexion, inscription, deconnexion)
@Injectable({ providedIn: 'root' })
export class AuthService {

    // url de l'api d'authentification
    private api = environment.authApiUrl;

    constructor(private http: HttpClient, private router: Router) { }

    // connexion d'un utilisateur
    login(data: LoginRequest): Observable<any> {
        return this.http.post<any>(this.api + '/login', data, { withCredentials: true }).pipe(
            tap(res => {
                // Stocker le token pour l'intercepteur
                if (res.token) localStorage.setItem('maka_token', res.token);
            }),
            switchMap(() => this.http.get<{ user: any }>(this.api + '/profile', { withCredentials: true })),
            tap((res) => {
                let user = this.mapUser(res.user);
                localStorage.setItem('user', JSON.stringify(user));
            })
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
        return this.http.post(this.api + '/register', backendData, { withCredentials: true });
    }

    // deconnexion : suppression du profil local + appel backend best-effort
    logout(): void {
        this.http.post(this.api + '/logout', {}, { withCredentials: true }).subscribe({
            next: () => { },
            error: () => { }
        });
        localStorage.removeItem('user');
        localStorage.removeItem('maka_token');
        this.router.navigate(['/login']);
    }

    // verifier si l'utilisateur est connecte (etat local minimal)
    isLoggedIn(): boolean {
        let user = localStorage.getItem('user');
        if (user) {
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

    private mapUser(rawUser: any): User {
        return {
            id: rawUser?.id,
            nom: rawUser?.nom || rawUser?.lastName || '',
            prenom: rawUser?.prenom || rawUser?.firstName || '',
            email: rawUser?.email || '',
            roles: rawUser?.roles || []
        };
    }
}
