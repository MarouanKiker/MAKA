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

    // colonnes du kanban (chaque colonne = un statut string enum)
    columns = [
        { key: 0, label: 'Nouveau', color: '#4a9eff' },
        { key: 2, label: 'Qualifié', color: '#a0a0a0' },
        { key: 1, label: 'Contacté', color: '#f5c748' },
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
            statut: 0, // NOUVEAU
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

    showConvertForm = false;
    oppTitre = '';
    oppValeur = 0;
    leadToConvert: Lead | null = null;

    openConvertForm(lead: Lead): void {
        this.leadToConvert = lead;
        this.oppTitre = 'Opportunité - ' + lead.source;
        this.oppValeur = 0;
        this.showConvertForm = true;
    }

    confirmConvert(): void {
        if (!this.leadToConvert) return;
        
        const lead = this.leadToConvert;
        this.crm.convertLead(lead.id, this.oppTitre, this.oppValeur).subscribe({
            next: (newOpp) => {
                lead.statut = 3; // CONVERTI
                this.showConvertForm = false;
                this.leadToConvert = null;
            },
            error: (err) => {
                console.error('Erreur conversion', err);
                if (err.status === 409) {
                    alert('Ce Lead a déjà été converti en Opportunité !');
                    lead.statut = 3; // Synchroniser l'UI
                } else {
                    alert('Une erreur est survenue lors de la conversion.');
                }
                this.showConvertForm = false;
                this.leadToConvert = null;
            }
        });
    }

    cancelConvert(): void {
        this.showConvertForm = false;
        this.leadToConvert = null;
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
                this.openConvertForm(currentLead);
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
