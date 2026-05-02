import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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

    columns = [
        { key: 'NOUVEAU', label: 'Nouveau', color: '#4a9eff' },
        { key: 'QUALIFIE', label: 'Qualifié', color: '#a0a0a0' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'CONVERTI', label: 'Converti', color: '#44d492' },
        { key: 'PERDU', label: 'Perdu', color: '#e84c3d' },
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

    getByStatut(statut: string): Lead[] {
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
            statut: 'NOUVEAU',
            score: this.score,
            dateCreation: new Date().toISOString()
        };

        this.crm.createLead(newLead).subscribe({
            next: () => {
                this.loadLeads();
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
            next: () => {
                lead.statut = 'CONVERTI';
                this.showConvertForm = false;
                this.leadToConvert = null;
            },
            error: (err) => {
                console.error('Erreur conversion', err);
                if (err.status === 409) {
                    alert('Ce Lead a déjà été converti en Opportunité !');
                    lead.statut = 'CONVERTI';
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
        if (!confirm('Supprimer ce lead ?')) return;
        this.crm.deleteLead(id).subscribe({
            next: () => this.loadLeads(),
            error: (err) => console.error('Erreur suppression lead', err)
        });
    }

    onDragStart(lead: Lead): void {
        this.draggedLead = lead;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, newStatut: string): void {
        event.preventDefault();
        if (!this.draggedLead || this.draggedLead.statut === newStatut) {
            this.draggedLead = null;
            return;
        }
        const lead = this.draggedLead;
        this.crm.updateLead(lead.id, { statut: newStatut }).subscribe({
            next: () => { lead.statut = newStatut; },
            error: (err) => console.error('Erreur mise à jour statut', err)
        });
        this.draggedLead = null;
    }

    onDragEnd(): void {
        this.draggedLead = null;
    }
}
