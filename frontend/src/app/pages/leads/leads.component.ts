import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Lead } from '../../core/models/crm.model';

@Component({
    selector: 'app-leads',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './leads.component.html',
    styleUrls: ['../shared/crm-page.scss', './leads.component.scss']
})
export class LeadsComponent implements OnInit {

    showForm = false;
    source = 'Site Web';
    score = 50;

    leads: Lead[] = [];

    // colonnes du kanban (chaque colonne = un statut int enum)
    columns = [
        { key: 0, label: 'Nouveau', color: '#4a9eff' },
        { key: 1, label: 'Contacté', color: '#a0a0a0' },
        { key: 2, label: 'Qualifié', color: '#f5c748' },
        { key: 3, label: 'Converti', color: '#44d492' },
        { key: 4, label: 'Perdu', color: '#e84c3d' },
    ];

    draggedLead: Lead | null = null;

    constructor(private crm: CrmService) { }

    ngOnInit(): void {
        this.loadLeads();
    }

    loadLeads(): void {
        this.crm.getLeads().subscribe({
            next: (data) => this.leads = data,
            error: (err) => console.error('Erreur chargement leads', err)
        });
    }

    getByStatut(statut: number): Lead[] {
        return this.leads.filter(l => l.statut === statut);
    }

    openForm(): void {
        this.source = 'Site Web';
        this.score = 50;
        this.showForm = true;
    }

    save(): void {
        const newLead: Partial<Lead> = {
            source: this.source,
            statut: 0, 
            score: this.score,
            dateCreation: new Date().toISOString()
        };

        this.crm.createLead(newLead).subscribe({
            next: (created) => {
                this.leads.push(created);
                this.showForm = false;
            },
            error: (err) => console.error('Erreur creation lead', err)
        });
    }

    convertir(lead: Lead): void {
        if (lead.statut === 3) return; // CONVERTI
        
        this.crm.convertLead(lead.id).subscribe({
            next: (newOpp) => {
                lead.statut = 3;
            },
            error: (err) => console.error('Erreur conversion', err)
        });
    }

    delete(id: number): void {
        this.crm.deleteLead(id).subscribe({
            next: () => {
                this.leads = this.leads.filter(l => l.id !== id);
            },
            error: (err) => console.error('Erreur suppression lead', err)
        });
    }

    // --- drag & drop ---
    onDragStart(lead: Lead): void {
        this.draggedLead = lead;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, statut: number): void {
        event.preventDefault();
        if (this.draggedLead) {
            const currentLead = this.draggedLead;
            const previousStatut = currentLead.statut;
            
            if (statut === 3 && previousStatut !== 3) {
                this.convertir(currentLead);
            } else if (previousStatut !== statut) {
                const oldStatut = currentLead.statut;
                currentLead.statut = statut; // optimiste
                this.crm.updateLead(currentLead.id, { 
                    statut: statut, 
                    source: currentLead.source, 
                    score: currentLead.score 
                }).subscribe({
                    next: () => {},
                    error: (err) => {
                        console.error('Erreur maj statut', err);
                        currentLead.statut = oldStatut; // revert
                    }
                });
            }
            this.draggedLead = null;
        }
    }

    onDragEnd(): void {
        this.draggedLead = null;
    }
}
