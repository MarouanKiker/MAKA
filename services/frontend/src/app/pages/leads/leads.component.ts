import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les leads (prospects)
@Component({
    selector: 'app-leads',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './leads.component.html',
    styleUrls: ['../shared/crm-page.scss', './leads.component.scss']
})
export class LeadsComponent {

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    source = 'Site Web';
    score = 50;
    responsable = '';

    // colonnes du kanban (chaque colonne = un statut)
    columns = [
        { key: 'NOUVEAU', label: 'Nouveau', color: '#4a9eff' },
        { key: 'QUALIFIE', label: 'Qualifie', color: '#f5c748' },
        { key: 'EN_COURS', label: 'En cours', color: '#e88554' },
        { key: 'CONVERTI', label: 'Converti', color: '#44d492' },
    ];

    // le lead qu'on est en train de glisser (drag & drop)
    draggedLead: any = null;

    constructor(public crm: CrmService) { }

    // recuperer les leads d'un certain statut
    getByStatut(statut: string): any[] {
        let result = [];
        for (let i = 0; i < this.crm.leads.length; i++) {
            if (this.crm.leads[i].statut === statut) {
                result.push(this.crm.leads[i]);
            }
        }
        return result;
    }

    // ouvrir le formulaire d'ajout
    openForm(): void {
        this.source = 'Site Web';
        this.score = 50;
        this.responsable = '';
        this.showForm = true;
    }

    // sauvegarder un nouveau lead
    save(): void {
        this.crm.addLead({
            source: this.source,
            statut: 'NOUVEAU',
            score: this.score,
            dateCreation: new Date().toISOString().split('T')[0],
            responsable: this.responsable,
            campagneId: null
        });
        this.showForm = false;
    }

    // convertir un lead en opportunite
    convertir(lead: any): void {
        if (lead.statut === 'CONVERTI') {
            return; // deja converti
        }
        // creer une nouvelle opportunite a partir du lead
        this.crm.addOpportunity({
            titre: 'Opportunite - ' + lead.source,
            valeur: 0,
            statut: 'NOUVELLE',
            dateCloture: '',
            leadId: lead.id
        });
        lead.statut = 'CONVERTI';
    }

    // supprimer un lead
    delete(id: number): void {
        this.crm.deleteLead(id);
    }

    // --- drag & drop ---

    // quand on commence a glisser un lead
    onDragStart(lead: any): void {
        this.draggedLead = lead;
    }

    // autoriser le drop sur la colonne
    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    // quand on depose le lead dans une colonne
    onDrop(event: DragEvent, statut: string): void {
        event.preventDefault();
        if (this.draggedLead) {
            // si on depose dans "converti", on convertit le lead
            if (statut === 'CONVERTI' && this.draggedLead.statut !== 'CONVERTI') {
                this.convertir(this.draggedLead);
            } else {
                // sinon on change juste le statut
                this.draggedLead.statut = statut;
            }
            this.draggedLead = null;
        }
    }

    // quand on arrete de glisser
    onDragEnd(): void {
        this.draggedLead = null;
    }
}
