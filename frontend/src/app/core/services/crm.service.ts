import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Lead, Opportunity, Campaign, Account, Contact,
  Task, CreateTaskDto,
  Ticket, CreateTicketDto,
  Interaction, CreateInteractionDto,
  CreateAccountPayload, PaginatedAccounts,
  CreateContactPayload
} from '../models/crm.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CrmService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/crm`;

    // ==========================================================
    // COMPTES (Accounts) — API réelle
    // ==========================================================
    getAccounts(search?: string, page = 1, pageSize = 10): Observable<PaginatedAccounts> {
        let params = new HttpParams().set('page', page).set('pageSize', pageSize);
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedAccounts>(`${this.apiUrl}/accounts`, { params });
    }
    getAccount(id: number): Observable<Account> { return this.http.get<Account>(`${this.apiUrl}/accounts/${id}`); }
    createAccount(payload: CreateAccountPayload): Observable<Account> { return this.http.post<Account>(`${this.apiUrl}/accounts`, payload); }
    updateAccount(id: number, payload: Partial<CreateAccountPayload>): Observable<Account> { return this.http.put<Account>(`${this.apiUrl}/accounts/${id}`, payload); }
    deleteAccount(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/accounts/${id}`); }

    // ==========================================================
    // CONTACTS — API réelle
    // ==========================================================
    getContacts(compteId?: number, search?: string): Observable<Contact[]> {
        let params = new HttpParams();
        if (compteId) params = params.set('compteId', compteId);
        if (search)   params = params.set('search', search);
        return this.http.get<Contact[]>(`${this.apiUrl}/contacts`, { params });
    }
    getContact(id: number): Observable<Contact> { return this.http.get<Contact>(`${this.apiUrl}/contacts/${id}`); }
    createContact(payload: CreateContactPayload): Observable<Contact> { return this.http.post<Contact>(`${this.apiUrl}/contacts`, payload); }
    updateContact(id: number, payload: Partial<CreateContactPayload>): Observable<Contact> { return this.http.put<Contact>(`${this.apiUrl}/contacts/${id}`, payload); }
    deleteContact(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/contacts/${id}`); }

    // ==========================================================
    // LEADS
    // ==========================================================
    getLeads(): Observable<Lead[]> { 
        return this.http.get<Lead[]>(`${this.apiUrl}/leads`).pipe(
            map(leads => leads.map(l => ({ ...l, statut: this.mapLeadStatut(l.statut) as any })))
        ); 
    }

    private mapLeadStatut(s: any): string {
        if (typeof s === 'string') return s;
        const mapping: any = { 0: 'NOUVEAU', 1: 'QUALIFIE', 2: 'EN_COURS', 3: 'CONVERTI', 4: 'PERDU' };
        return mapping[s] || s;
    }

    private mapOppStatut(s: any): string {
        if (typeof s === 'string') return s;
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

    getCampaigns(): Observable<Campaign[]> { return this.http.get<Campaign[]>(`${this.apiUrl}/campagnes`); }
    getCampaign(id: number): Observable<Campaign> { return this.http.get<Campaign>(`${this.apiUrl}/campagnes/${id}`); }
    createCampaign(campaign: Partial<Campaign>): Observable<Campaign> { return this.http.post<Campaign>(`${this.apiUrl}/campagnes`, campaign); }
    updateCampaign(id: number, campaign: Partial<Campaign>): Observable<any> { return this.http.put(`${this.apiUrl}/campagnes/${id}`, campaign); }
    deleteCampaign(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/campagnes/${id}`); }

    getOpportunities(): Observable<Opportunity[]> { 
        return this.http.get<Opportunity[]>(`${this.apiUrl}/opportunites`).pipe(
            map(opps => opps.map(o => ({ ...o, statut: this.mapOppStatut(o.statut) as any })))
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

