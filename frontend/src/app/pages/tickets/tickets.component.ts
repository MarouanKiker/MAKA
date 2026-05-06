import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Ticket, CreateTicketDto } from '../../core/models/crm.model';

@Component({
    selector: 'app-tickets',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tickets.component.html',
    styleUrls: ['../shared/crm-page.scss', './tickets.component.scss']
})
export class TicketsComponent implements OnInit {

    tickets: Ticket[] = [];
    showForm = false;
    message = '';

    // Champs du formulaire
    title = '';
    description = '';
    leadId: number | null = null;

    // Colonnes kanban : backend utilise 'Open', 'Pending', 'Closed'
    columns = [
        { key: 'Open', label: 'Ouvert', color: '#4a9eff' },
        { key: 'Pending', label: 'En cours', color: '#f5c748' },
        { key: 'Closed', label: 'Fermé', color: '#44d492' },
    ];

    draggedTicket: Ticket | null = null;

    constructor(private crm: CrmService) {}

    ngOnInit(): void {
        this.loadTickets();
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) {
                this.message = '';
            }
        }, 4000);
    }

    loadTickets(): void {
        this.crm.getTickets().subscribe({
            next: (data) => this.tickets = data,
            error: (err) => {
                console.error('Erreur chargement tickets', err);
                this.showMessage('Erreur de chargement des tickets');
            }
        });
    }

    getByStatus(status: string): Ticket[] {
        return this.tickets.filter(t => t.status === status);
    }

    openForm(): void {
        this.title = '';
        this.description = '';
        this.leadId = null;
        this.showForm = true;
        this.message = '';
    }

    save(): void {
        if (!this.title) return;
        const dto: CreateTicketDto = {
            title: this.title,
            description: this.description,
            status: 'Open',
            leadId: this.leadId || null
        };
        this.crm.createTicket(dto).subscribe({
            next: (created) => {
                this.tickets.push(created);
                this.showForm = false;
                this.showMessage('Ticket créé !');
            },
            error: (err) => {
                console.error('Erreur création ticket', err);
                this.showMessage('Erreur lors de la création');
            }
        });
    }

    changeStatus(ticket: Ticket, newStatus: string): void {
        const oldStatus = ticket.status;
        ticket.status = newStatus; // optimiste
        this.crm.updateTicket(ticket.id, { status: newStatus }).subscribe({
            error: (err) => {
                console.error('Erreur mise à jour ticket', err);
                ticket.status = oldStatus; // revert
            }
        });
    }

    delete(id: number): void {
        this.crm.deleteTicket(id).subscribe({
            next: () => { this.tickets = this.tickets.filter(t => t.id !== id); },
            error: (err) => console.error('Erreur suppression ticket', err)
        });
    }


    // --- drag & drop ---
    onDragStart(ticket: Ticket): void { this.draggedTicket = ticket; }
    onDragOver(event: DragEvent): void { event.preventDefault(); }

    onDrop(event: DragEvent, status: string): void {
        event.preventDefault();
        if (this.draggedTicket && this.draggedTicket.status !== status) {
            this.changeStatus(this.draggedTicket, status);
        }
        this.draggedTicket = null;
    }

    onDragEnd(): void { this.draggedTicket = null; }
}
