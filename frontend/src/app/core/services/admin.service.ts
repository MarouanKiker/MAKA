import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserAdmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
    private api = environment.authApiUrl + '/admin';

    constructor(private http: HttpClient) {}

    // Lister tous les utilisateurs
    getUsers(): Observable<any> {
        return this.http.get(this.api + '/users');
    }

    // Mettre à jour les rôles d'un utilisateur
    updateRoles(userId: number, roles: string[]): Observable<any> {
        return this.http.put(this.api + '/users/' + userId + '/roles', { roles });
    }

    // Supprimer un utilisateur
    deleteUser(userId: number): Observable<any> {
        return this.http.delete(this.api + '/users/' + userId);
    }
}
