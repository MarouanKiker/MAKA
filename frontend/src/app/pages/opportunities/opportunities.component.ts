import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Opportunity } from '../../core/models/crm.model';

@Component({
    selector: 'app-opportunities',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './opportunities.component.html',
    styleUrls: ['../shared/crm-page.scss', './opportunities.component.scss']
})
export class OpportunitiesComponent implements OnInit {

    // colonnes du kanban pipeline
    columns = [
        { key: 'NOUVELLE', label: 'Nouvelle', color: '#4a9eff' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'GAGNEE', label: 'Gagnée', color: '#44d492' },
        { key: 'PERDUE', label: 'Perdue', color: '#f06c62' },
    ];

    opportunities: Opportunity[] = [];
    draggedOpp: Opportunity | null = null;

    constructor(private crm: CrmService) { }

    ngOnInit(): void {
        this.loadOpportunities();
    }

    loadOpportunities(): void {
        this.crm.getOpportunities().subscribe({
            next: (data) => this.opportunities = data,
            error: (err) => console.error('Erreur chargement opportunites', err)
        });
    }

    getByStatut(statut: string): Opportunity[] {
        return this.opportunities.filter(o => o.statut === statut);
    }

    // --- drag & drop ---
    onDragStart(opp: Opportunity): void {
        this.draggedOpp = opp;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, statut: string): void {
        event.preventDefault();
        if (this.draggedOpp) {
            const currentOpp = this.draggedOpp;
            const oldStatut = currentOpp.statut;
            
            if (oldStatut !== statut) {
                currentOpp.statut = statut;
                
                if (statut === 'GAGNEE' || statut === 'PERDUE') {
                    currentOpp.dateCloture = new Date().toISOString();
                }

                this.crm.updateOpportunity(currentOpp.id, { 
                    statut: statut, 
                    titre: currentOpp.titre, 
                    valeur: currentOpp.valeur,
                    dateCloture: currentOpp.dateCloture
                }).subscribe({
                    next: () => {},
                    error: (err) => {
                        console.error('Erreur maj statut opportunite', err);
                        currentOpp.statut = oldStatut; // revert
                    }
                });
            }
            this.draggedOpp = null;
        }
    }

    onDragEnd(): void {
        this.draggedOpp = null;
    }
}
