import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les opportunites (pipeline commercial)
@Component({
    selector: 'app-opportunities',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './opportunities.component.html',
    styleUrls: ['../shared/crm-page.scss', './opportunities.component.scss']
})
export class OpportunitiesComponent {

    // colonnes du kanban pipeline
    columns = [
        { key: 'NOUVELLE', label: 'Nouvelle', color: '#4a9eff' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'GAGNEE', label: 'Gagnee', color: '#44d492' },
        { key: 'PERDUE', label: 'Perdue', color: '#f06c62' },
    ];

    // l'opportunite qu'on glisse (drag & drop)
    draggedOpp: any = null;

    constructor(public crm: CrmService) { }

    // recuperer les opportunites d'un certain statut
    getByStatut(statut: string): any[] {
        let result = [];
        for (let i = 0; i < this.crm.opportunities.length; i++) {
            if (this.crm.opportunities[i].statut === statut) {
                result.push(this.crm.opportunities[i]);
            }
        }
        return result;
    }

    // --- drag & drop ---

    // debut du glisser
    onDragStart(opp: any): void {
        this.draggedOpp = opp;
    }

    // autoriser le depot
    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    // deposer dans une colonne
    onDrop(event: DragEvent, statut: string): void {
        event.preventDefault();
        if (this.draggedOpp) {
            // changer le statut de l'opportunite
            this.draggedOpp.statut = statut;
            // si gagnee ou perdue, on met la date de cloture
            if (statut === 'GAGNEE' || statut === 'PERDUE') {
                this.draggedOpp.dateCloture = new Date().toISOString().split('T')[0];
            }
            this.draggedOpp = null;
        }
    }

    // fin du glisser
    onDragEnd(): void {
        this.draggedOpp = null;
    }
}
