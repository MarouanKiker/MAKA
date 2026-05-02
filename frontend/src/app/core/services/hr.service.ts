import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employe, Contrat, DemandeConge, FicheDePaie, Reclamation } from '../models/hr.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HrService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/hr`;

    // ========================
    // EMPLOYÉS (lecture seule — créés via Auth Service)
    // ========================
    getEmployes(): Observable<Employe[]> {
        return this.http.get<Employe[]>(`${this.apiUrl}/employes`);
    }
    getEmploye(id: number): Observable<Employe> {
        return this.http.get<Employe>(`${this.apiUrl}/employes/${id}`);
    }

    // ========================
    // CONTRATS
    // ========================
    getContrats(): Observable<Contrat[]> {
        return this.http.get<Contrat[]>(`${this.apiUrl}/contrats`);
    }
    getContratsByEmploye(employeId: number): Observable<Contrat[]> {
        return this.http.get<Contrat[]>(`${this.apiUrl}/contrats/employe/${employeId}`);
    }
    createContrat(employeId: number, contrat: Partial<Contrat>): Observable<Contrat> {
        return this.http.post<Contrat>(`${this.apiUrl}/contrats/employe/${employeId}`, contrat);
    }
    deleteContrat(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/contrats/${id}`);
    }

    // ========================
    // DEMANDES DE CONGÉ
    // ========================
    getDemandesConge(): Observable<DemandeConge[]> {
        return this.http.get<DemandeConge[]>(`${this.apiUrl}/conges`);
    }
    createDemandeConge(demande: Partial<DemandeConge>): Observable<DemandeConge> {
        const employeId = demande.employeId;
        return this.http.post<DemandeConge>(`${this.apiUrl}/conges/employe/${employeId}`, demande);
    }
    approuverDemande(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/conges/${id}/decision?accepter=true`, {});
    }
    refuserDemande(id: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/conges/${id}/decision?accepter=false`, {});
    }

    // ========================
    // FICHES DE PAIE
    // ========================
    getFichesDePaie(): Observable<FicheDePaie[]> {
        return this.http.get<FicheDePaie[]>(`${this.apiUrl}/paie`);
    }
    genererFicheDePaie(employeId: number, mois: number, annee: number): Observable<FicheDePaie> {
        return this.http.post<FicheDePaie>(`${this.apiUrl}/paie/generer/${employeId}?mois=${mois}&annee=${annee}`, {});
    }

    // ========================
    // RÉCLAMATIONS
    // ========================
    getReclamations(): Observable<Reclamation[]> {
        return this.http.get<Reclamation[]>(`${this.apiUrl}/reclamations`);
    }
    createReclamation(employeId: number, rec: Partial<Reclamation>): Observable<Reclamation> {
        return this.http.post<Reclamation>(`${this.apiUrl}/reclamations/employe/${employeId}`, rec);
    }
    traiterReclamation(id: number, reponse: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/reclamations/${id}/traiter`, JSON.stringify(reponse), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // ========================
    // ESPACE EMPLOYÉ (Self-Service)
    // ========================
    getEmployeByEmail(email: string): Observable<Employe> {
        return this.http.get<Employe>(`${this.apiUrl}/employes/by-email/${email}`);
    }
    getMesConges(employeId: number): Observable<DemandeConge[]> {
        return this.http.get<DemandeConge[]>(`${this.apiUrl}/conges/employe/${employeId}`);
    }
    getMesFiches(employeId: number): Observable<FicheDePaie[]> {
        return this.http.get<FicheDePaie[]>(`${this.apiUrl}/paie/employe/${employeId}`);
    }
    getMesReclamations(employeId: number): Observable<Reclamation[]> {
        return this.http.get<Reclamation[]>(`${this.apiUrl}/reclamations/employe/${employeId}`);
    }
    getMesContrats(employeId: number): Observable<Contrat[]> {
        return this.http.get<Contrat[]>(`${this.apiUrl}/contrats/employe/${employeId}`);
    }
}
