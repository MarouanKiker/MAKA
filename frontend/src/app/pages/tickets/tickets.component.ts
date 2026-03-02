import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les tickets de support
@Component({
    selector: 'app-tickets',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets.component.html',
    styleUrls: ['../shared/crm-page.scss', './tickets.component.scss']
})
export class TicketsComponent {

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    sujet = '';
    priorite = 'Moyenne';
    accountId = 0;
    agent = '';

    // colonnes du kanban
    columns = [
        { key: 'OUVERT', label: 'Ouvert', color: '#4a9eff' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'RESOLU', label: 'Resolu', color: '#44d492' },
        { key: 'FERME', label: 'Ferme', color: '#9370ff' },
    ];

    // le ticket qu'on glisse
    draggedTicket: any = null;

    constructor(public crm: CrmService) { }

    // recuperer les tickets d'un certain statut
    getByStatut(statut: string): any[] {
        let result = [];
        for (let i = 0; i < this.crm.tickets.length; i++) {
            if (this.crm.tickets[i].statut === statut) {
                result.push(this.crm.tickets[i]);
            }
        }
        return result;
    }

    // ouvrir le formulaire d'ajout
    openForm(): void {
        this.sujet = '';
        this.priorite = 'Moyenne';
        this.agent = '';
        // prendre le premier compte par defaut
        if (this.crm.accounts.length > 0) {
            this.accountId = this.crm.accounts[0].id;
        } else {
            this.accountId = 0;
        }
        this.showForm = true;
    }

    // sauvegarder un nouveau ticket
    save(): void {
        this.crm.addTicket({
            sujet: this.sujet,
            statut: 'OUVERT',
            priorite: this.priorite,
            dateCreation: new Date().toISOString().split('T')[0],
            accountId: this.accountId,
            agent: this.agent
        });
        this.showForm = false;
    }

    // --- drag & drop ---

    // debut du glisser
    onDragStart(ticket: any): void {
        this.draggedTicket = ticket;
    }

    // autoriser le depot
    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    // deposer pour changer le statut
    onDrop(event: DragEvent, statut: string): void {
        event.preventDefault();
        if (this.draggedTicket) {
            this.draggedTicket.statut = statut;
            this.draggedTicket = null;
        }
    }

    // fin du glisser
    onDragEnd(): void {
        this.draggedTicket = null;
    }
}
