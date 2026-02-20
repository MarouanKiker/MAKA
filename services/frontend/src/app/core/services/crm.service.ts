import { Injectable } from '@angular/core';
import { Account, Contact, Lead, Opportunity, Task, Ticket, Campaign, Interaction } from '../models/crm.model';

// service qui gere toutes les donnees CRM
// pour l'instant les donnees sont en dur (mock)
// quand le backend sera pret on remplacera par des appels HTTP
@Injectable({ providedIn: 'root' })
export class CrmService {

    // --- donnees des comptes clients ---
    accounts: Account[] = [
        { id: 1, nom: 'TechnoMaroc SARL', email: 'contact@technomaroc.ma', telephone: '0522-112233', responsable: 'Marwan Kiker' },
        { id: 2, nom: 'Digital Solutions', email: 'info@digsol.ma', telephone: '0537-445566', responsable: 'Abdellah Ajebli' },
        { id: 3, nom: 'Atlas Commerce', email: 'atlas@commerce.ma', telephone: '0528-778899', responsable: 'Marwan Kiker' },
        { id: 4, nom: 'Sahara Logistics', email: 'contact@saharalog.ma', telephone: '0524-334455', responsable: 'Abdelilah Hamdaoui' },
    ];

    // --- donnees des contacts ---
    contacts: Contact[] = [
        { id: 1, nom: 'Ahmed Bennani', type: 'Decideur', adresse: 'Casablanca', accountId: 1 },
        { id: 2, nom: 'Sara El Idrissi', type: 'Technique', adresse: 'Rabat', accountId: 2 },
        { id: 3, nom: 'Karim Alaoui', type: 'Decideur', adresse: 'Marrakech', accountId: 3 },
        { id: 4, nom: 'Fatima Zahra Benali', type: 'Autre', adresse: 'Agadir', accountId: 4 },
        { id: 5, nom: 'Youssef Mansouri', type: 'Technique', adresse: 'Casablanca', accountId: 1 },
    ];

    // --- donnees des leads ---
    leads: Lead[] = [
        { id: 1, source: 'Site Web', statut: 'NOUVEAU', score: 30, dateCreation: '2026-01-15', responsable: 'Marwan Kiker', campagneId: 1 },
        { id: 2, source: 'Salon', statut: 'QUALIFIE', score: 75, dateCreation: '2026-01-20', responsable: 'Abdellah Ajebli', campagneId: 2 },
        { id: 3, source: 'Recommandation', statut: 'EN_COURS', score: 60, dateCreation: '2026-02-01', responsable: 'Marwan Kiker', campagneId: null },
        { id: 4, source: 'Email', statut: 'CONVERTI', score: 90, dateCreation: '2026-02-05', responsable: 'Abdellah Ajebli', campagneId: 1 },
    ];

    // --- donnees des opportunites ---
    opportunities: Opportunity[] = [
        { id: 1, titre: 'Projet ERP TechnoMaroc', valeur: 120000, statut: 'EN_COURS', dateCloture: '', leadId: 4 },
        { id: 2, titre: 'Licence CRM Digital Sol', valeur: 45000, statut: 'NOUVELLE', dateCloture: '', leadId: 2 },
    ];

    // --- donnees des taches ---
    tasks: Task[] = [
        { id: 1, titre: 'Appeler TechnoMaroc', description: 'Suivi du devis envoye', dateEcheance: '2026-02-25', priorite: 'Haute', statut: 'A_FAIRE', assigneA: 'Marwan Kiker' },
        { id: 2, titre: 'Preparer demo CRM', description: 'Demo pour Digital Solutions', dateEcheance: '2026-03-01', priorite: 'Moyenne', statut: 'EN_COURS', assigneA: 'Abdellah Ajebli' },
        { id: 3, titre: 'Envoyer contrat Atlas', description: 'Contrat commercial', dateEcheance: '2026-02-28', priorite: 'Haute', statut: 'A_FAIRE', assigneA: 'Marwan Kiker' },
    ];

    // --- donnees des tickets ---
    tickets: Ticket[] = [
        { id: 1, sujet: 'Probleme de facturation', statut: 'OUVERT', priorite: 'Haute', dateCreation: '2026-02-10', accountId: 1, agent: 'Abderahmane Missaoui' },
        { id: 2, sujet: 'Demande info produit', statut: 'EN_COURS', priorite: 'Moyenne', dateCreation: '2026-02-12', accountId: 3, agent: 'Abderahmane Missaoui' },
        { id: 3, sujet: 'Bug interface client', statut: 'RESOLU', priorite: 'Basse', dateCreation: '2026-02-08', accountId: 2, agent: 'Abderahmane Missaoui' },
    ];

    // --- donnees des campagnes ---
    campaigns: Campaign[] = [
        { id: 1, nom: 'Campagne Email Janvier', budget: 5000, dateDebut: '2026-01-01', dateFin: '2026-01-31' },
        { id: 2, nom: 'Salon IT Fevrier', budget: 15000, dateDebut: '2026-02-10', dateFin: '2026-02-12' },
    ];

    // --- donnees des interactions ---
    interactions: Interaction[] = [
        { id: 1, type: 'Appel', dateInteraction: '2026-02-15', contactId: 1, notes: 'Discussion sur le projet ERP' },
        { id: 2, type: 'Email', dateInteraction: '2026-02-16', contactId: 2, notes: 'Envoi documentation technique' },
        { id: 3, type: 'Reunion', dateInteraction: '2026-02-18', contactId: 3, notes: 'Presentation commerciale' },
    ];

    // chercher le nom d'un compte par son id
    getAccountName(id: number): string {
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id === id) {
                return this.accounts[i].nom;
            }
        }
        return 'Inconnu';
    }

    // chercher le nom d'un contact par son id
    getContactName(id: number): string {
        for (let i = 0; i < this.contacts.length; i++) {
            if (this.contacts[i].id === id) {
                return this.contacts[i].nom;
            }
        }
        return 'Inconnu';
    }

    // calculer le prochain id pour une liste
    private nextId(list: any[]): number {
        if (list.length === 0) {
            return 1;
        }
        // on cherche l'id le plus grand et on ajoute 1
        let maxId = 0;
        for (let i = 0; i < list.length; i++) {
            if (list[i].id > maxId) {
                maxId = list[i].id;
            }
        }
        return maxId + 1;
    }

    // --- methodes pour ajouter et supprimer ---

    // ajouter un compte
    addAccount(account: Partial<Account>): void {
        let newAccount = account as Account;
        newAccount.id = this.nextId(this.accounts);
        this.accounts.push(newAccount);
    }

    // supprimer un compte par son id
    deleteAccount(id: number): void {
        let result: Account[] = [];
        for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i].id !== id) {
                result.push(this.accounts[i]);
            }
        }
        this.accounts = result;
    }

    // ajouter un contact
    addContact(contact: Partial<Contact>): void {
        let newContact = contact as Contact;
        newContact.id = this.nextId(this.contacts);
        this.contacts.push(newContact);
    }

    // supprimer un contact
    deleteContact(id: number): void {
        let result: Contact[] = [];
        for (let i = 0; i < this.contacts.length; i++) {
            if (this.contacts[i].id !== id) {
                result.push(this.contacts[i]);
            }
        }
        this.contacts = result;
    }

    // ajouter un lead
    addLead(lead: Partial<Lead>): void {
        let newLead = lead as Lead;
        newLead.id = this.nextId(this.leads);
        this.leads.push(newLead);
    }

    // supprimer un lead
    deleteLead(id: number): void {
        let result: Lead[] = [];
        for (let i = 0; i < this.leads.length; i++) {
            if (this.leads[i].id !== id) {
                result.push(this.leads[i]);
            }
        }
        this.leads = result;
    }

    // ajouter une opportunite
    addOpportunity(opp: Partial<Opportunity>): void {
        let newOpp = opp as Opportunity;
        newOpp.id = this.nextId(this.opportunities);
        this.opportunities.push(newOpp);
    }

    // ajouter une tache
    addTask(task: Partial<Task>): void {
        let newTask = task as Task;
        newTask.id = this.nextId(this.tasks);
        this.tasks.push(newTask);
    }

    // supprimer une tache
    deleteTask(id: number): void {
        let result: Task[] = [];
        for (let i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].id !== id) {
                result.push(this.tasks[i]);
            }
        }
        this.tasks = result;
    }

    // ajouter un ticket
    addTicket(ticket: Partial<Ticket>): void {
        let newTicket = ticket as Ticket;
        newTicket.id = this.nextId(this.tickets);
        this.tickets.push(newTicket);
    }

    // ajouter une campagne
    addCampaign(camp: Partial<Campaign>): void {
        let newCamp = camp as Campaign;
        newCamp.id = this.nextId(this.campaigns);
        this.campaigns.push(newCamp);
    }

    // supprimer une campagne
    deleteCampaign(id: number): void {
        let result: Campaign[] = [];
        for (let i = 0; i < this.campaigns.length; i++) {
            if (this.campaigns[i].id !== id) {
                result.push(this.campaigns[i]);
            }
        }
        this.campaigns = result;
    }

    // ajouter une interaction
    addInteraction(inter: Partial<Interaction>): void {
        let newInter = inter as Interaction;
        newInter.id = this.nextId(this.interactions);
        this.interactions.push(newInter);
    }
}
