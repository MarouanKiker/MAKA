import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
    Lead, Opportunity, CrmCampaign,
    Task, CreateTaskDto,
    Ticket, CreateTicketDto,
    Interaction, CreateInteractionDto
} from '../models/crm.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CrmService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/crm`;

    getLeads(): Observable<Lead[]> { 
        return this.http.get<Lead[]>(`${this.apiUrl}/leads`).pipe(
            map(leads => leads.map(l => ({ ...l, statut: this.mapLeadStatut(l.statut) })))
        ); 
    }

    private mapLeadStatut(s: any): string {
        const mapping: any = { 0: 'NOUVEAU', 1: 'QUALIFIE', 2: 'EN_COURS', 3: 'CONVERTI', 4: 'PERDU' };
        return mapping[s] || s;
    }

    private mapOppStatut(s: any): string {
        const mapping: any = { 0: 'NOUVELLE', 1: 'EN_COURS', 2: 'GAGNEE', 3: 'PERDUE' };
        return mapping[s] || s;
    }

    getLead(id: number): Observable<Lead> { return this.http.get<Lead>(`${this.apiUrl}/leads/${id}`); }
    createLead(lead: Partial<Lead>): Observable<Lead> { return this.http.post<Lead>(`${this.apiUrl}/leads`, lead); }
    updateLead(id: number, lead: Partial<Lead>): Observable<any> { return this.http.put(`${this.apiUrl}/leads/${id}`, lead); }
    deleteLead(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/leads/${id}`); }
    convertLead(id: number, titre: string, valeur: number): Observable<Opportunity> {
        return this.http.post<Opportunity>(`${this.apiUrl}/leads/${id}/convert`, { titre, valeur });
    }

    getCampaigns(): Observable<CrmCampaign[]> { return this.http.get<CrmCampaign[]>(`${this.apiUrl}/campagnes`); }
    getCampaign(id: number): Observable<CrmCampaign> { return this.http.get<CrmCampaign>(`${this.apiUrl}/campagnes/${id}`); }
    createCampaign(campaign: Partial<CrmCampaign>): Observable<CrmCampaign> { return this.http.post<CrmCampaign>(`${this.apiUrl}/campagnes`, campaign); }
    updateCampaign(id: number, campaign: Partial<CrmCampaign>): Observable<any> { return this.http.put(`${this.apiUrl}/campagnes/${id}`, campaign); }
    deleteCampaign(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/campagnes/${id}`); }

    getOpportunities(): Observable<Opportunity[]> { 
        return this.http.get<Opportunity[]>(`${this.apiUrl}/opportunites`).pipe(
            map(opps => opps.map(o => ({ ...o, statut: this.mapOppStatut(o.statut) })))
        ); 
    }
    getOpportunity(id: number): Observable<Opportunity> { return this.http.get<Opportunity>(`${this.apiUrl}/opportunites/${id}`); }
    createOpportunity(opp: Partial<Opportunity>): Observable<Opportunity> { return this.http.post<Opportunity>(`${this.apiUrl}/opportunites`, opp); }
    updateOpportunity(id: number, opp: Partial<Opportunity>): Observable<any> { return this.http.put(`${this.apiUrl}/opportunites/${id}`, opp); }
    deleteOpportunity(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/opportunites/${id}`); }

    getTasks(): Observable<Task[]> { return this.http.get<Task[]>(`${this.apiUrl}/tasks`); }
    getTask(id: number): Observable<Task> { return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`); }
    createTask(task: CreateTaskDto): Observable<Task> { return this.http.post<Task>(`${this.apiUrl}/tasks`, task); }
    updateTask(id: number, task: Partial<CreateTaskDto & { isCompleted: boolean }>): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, task);
    }
    deleteTask(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/tasks/${id}`); }
    toggleTask(id: number, isCompleted: boolean): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, { isCompleted });
    }

    getTickets(): Observable<Ticket[]> { return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`); }
    getTicket(id: number): Observable<Ticket> { return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}`); }
    createTicket(ticket: CreateTicketDto): Observable<Ticket> { return this.http.post<Ticket>(`${this.apiUrl}/tickets`, ticket); }
    updateTicket(id: number, ticket: Partial<CreateTicketDto>): Observable<Ticket> {
        return this.http.put<Ticket>(`${this.apiUrl}/tickets/${id}`, ticket);
    }
    deleteTicket(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/tickets/${id}`); }

    getInteractions(): Observable<Interaction[]> { return this.http.get<Interaction[]>(`${this.apiUrl}/interactions`); }
    getInteraction(id: number): Observable<Interaction> { return this.http.get<Interaction>(`${this.apiUrl}/interactions/${id}`); }
    createInteraction(interaction: CreateInteractionDto): Observable<Interaction> {
        return this.http.post<Interaction>(`${this.apiUrl}/interactions`, interaction);
    }
    updateInteraction(id: number, interaction: Partial<CreateInteractionDto>): Observable<Interaction> {
        return this.http.put<Interaction>(`${this.apiUrl}/interactions/${id}`, interaction);
    }
    deleteInteraction(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/interactions/${id}`); }
}
