import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    Lead, Opportunity, Campaign, Account, Contact,
    Task, CreateTaskDto,
    Ticket, CreateTicketDto,
    Interaction, CreateInteractionDto
} from '../models/crm.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CrmService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/crm`;

    // ==========================================================
    // LEADS
    // ==========================================================
    getLeads(): Observable<Lead[]> { return this.http.get<Lead[]>(`${this.apiUrl}/leads`); }
    getLead(id: number): Observable<Lead> { return this.http.get<Lead>(`${this.apiUrl}/leads/${id}`); }
    createLead(lead: Partial<Lead>): Observable<Lead> { return this.http.post<Lead>(`${this.apiUrl}/leads`, lead); }
    updateLead(id: number, lead: Partial<Lead>): Observable<any> { return this.http.put(`${this.apiUrl}/leads/${id}`, lead); }
    deleteLead(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/leads/${id}`); }
    convertLead(id: number, titre: string, valeur: number): Observable<Opportunity> {
        return this.http.post<Opportunity>(`${this.apiUrl}/leads/${id}/convert`, { titre, valeur });
    }

    // ==========================================================
    // CAMPAGNES
    // ==========================================================
    getCampaigns(): Observable<Campaign[]> { return this.http.get<Campaign[]>(`${this.apiUrl}/campagnes`); }
    getCampaign(id: number): Observable<Campaign> { return this.http.get<Campaign>(`${this.apiUrl}/campagnes/${id}`); }
    createCampaign(campaign: Partial<Campaign>): Observable<Campaign> { return this.http.post<Campaign>(`${this.apiUrl}/campagnes`, campaign); }
    updateCampaign(id: number, campaign: Partial<Campaign>): Observable<any> { return this.http.put(`${this.apiUrl}/campagnes/${id}`, campaign); }
    deleteCampaign(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/campagnes/${id}`); }

    // ==========================================================
    // OPPORTUNITES
    // ==========================================================
    getOpportunities(): Observable<Opportunity[]> { return this.http.get<Opportunity[]>(`${this.apiUrl}/opportunites`); }
    getOpportunity(id: number): Observable<Opportunity> { return this.http.get<Opportunity>(`${this.apiUrl}/opportunites/${id}`); }
    createOpportunity(opp: Partial<Opportunity>): Observable<Opportunity> { return this.http.post<Opportunity>(`${this.apiUrl}/opportunites`, opp); }
    updateOpportunity(id: number, opp: Partial<Opportunity>): Observable<any> { return this.http.put(`${this.apiUrl}/opportunites/${id}`, opp); }
    deleteOpportunity(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/opportunites/${id}`); }

    // ==========================================================
    // TASKS  →  api/crm/tasks
    // ==========================================================
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

    // ==========================================================
    // TICKETS  →  api/crm/tickets
    // ==========================================================
    getTickets(): Observable<Ticket[]> { return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`); }
    getTicket(id: number): Observable<Ticket> { return this.http.get<Ticket>(`${this.apiUrl}/tickets/${id}`); }
    createTicket(ticket: CreateTicketDto): Observable<Ticket> { return this.http.post<Ticket>(`${this.apiUrl}/tickets`, ticket); }
    updateTicket(id: number, ticket: Partial<CreateTicketDto>): Observable<Ticket> {
        return this.http.put<Ticket>(`${this.apiUrl}/tickets/${id}`, ticket);
    }
    deleteTicket(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/tickets/${id}`); }

    // ==========================================================
    // INTERACTIONS  →  api/crm/interactions
    // ==========================================================
    getInteractions(): Observable<Interaction[]> { return this.http.get<Interaction[]>(`${this.apiUrl}/interactions`); }
    getInteraction(id: number): Observable<Interaction> { return this.http.get<Interaction>(`${this.apiUrl}/interactions/${id}`); }
    createInteraction(interaction: CreateInteractionDto): Observable<Interaction> {
        return this.http.post<Interaction>(`${this.apiUrl}/interactions`, interaction);
    }
    updateInteraction(id: number, interaction: Partial<CreateInteractionDto>): Observable<Interaction> {
        return this.http.put<Interaction>(`${this.apiUrl}/interactions/${id}`, interaction);
    }
    deleteInteraction(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/interactions/${id}`); }

    // ==========================================================
    // ACCOUNTS & CONTACTS (mock en attendant un service dédié)
    // ==========================================================
    accounts: Account[] = [
        { id: 1, nom: 'TechnoMaroc SARL', email: 'contact@technomaroc.ma', telephone: '0522-112233', responsable: 'Marwan Kiker' }
    ];
    contacts: Contact[] = [
        { id: 1, nom: 'Ahmed Bennani', type: 'Decideur', adresse: 'Casablanca', accountId: 1 }
    ];

    getAccountName(id: number): string {
        const acc = this.accounts.find(a => a.id === id);
        return acc ? acc.nom : 'Inconnu';
    }
    getContactName(id: number): string {
        const c = this.contacts.find(c => c.id === id);
        return c ? c.nom : 'Inconnu';
    }
    private nextId(list: any[]): number { return list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1; }
    addAccount(account: Partial<Account>): void { this.accounts.push({ ...account, id: this.nextId(this.accounts) } as Account); }
    deleteAccount(id: number): void { this.accounts = this.accounts.filter(a => a.id !== id); }
    addContact(contact: Partial<Contact>): void { this.contacts.push({ ...contact, id: this.nextId(this.contacts) } as Contact); }
    deleteContact(id: number): void { this.contacts = this.contacts.filter(c => c.id !== id); }
}
