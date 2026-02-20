import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les taches
// les taches sont affichees en kanban avec drag & drop
@Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tasks.component.html',
    styleUrls: ['../shared/crm-page.scss', './tasks.component.scss']
})
export class TasksComponent {

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    titre = '';
    description = '';
    dateEcheance = '';
    priorite = 'Moyenne';
    assigneA = '';

    // colonnes du kanban
    columns = [
        { key: 'A_FAIRE', label: 'A faire', color: '#4a9eff' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'TERMINEE', label: 'Terminee', color: '#44d492' },
    ];

    // la tache qu'on glisse (drag & drop)
    draggedTask: any = null;

    constructor(public crm: CrmService) { }

    // recuperer les taches d'un certain statut
    getByStatut(statut: string): any[] {
        let result = [];
        for (let i = 0; i < this.crm.tasks.length; i++) {
            if (this.crm.tasks[i].statut === statut) {
                result.push(this.crm.tasks[i]);
            }
        }
        return result;
    }

    // compter toutes les taches
    countAll(): number {
        return this.crm.tasks.length;
    }

    // ouvrir le formulaire d'ajout
    openForm(): void {
        this.titre = '';
        this.description = '';
        this.dateEcheance = '';
        this.priorite = 'Moyenne';
        this.assigneA = '';
        this.showForm = true;
    }

    // sauvegarder une nouvelle tache
    save(): void {
        this.crm.addTask({
            titre: this.titre,
            description: this.description,
            dateEcheance: this.dateEcheance,
            priorite: this.priorite,
            statut: 'A_FAIRE',
            assigneA: this.assigneA
        });
        this.showForm = false;
    }

    // supprimer une tache
    delete(id: number): void {
        this.crm.deleteTask(id);
    }

    // --- drag & drop ---

    // debut du glisser
    onDragStart(task: any): void {
        this.draggedTask = task;
    }

    // autoriser le depot
    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    // deposer dans une colonne = changer le statut
    onDrop(event: DragEvent, newStatut: string): void {
        event.preventDefault();
        if (this.draggedTask) {
            this.draggedTask.statut = newStatut;
            this.draggedTask = null;
        }
    }

    // fin du glisser
    onDragEnd(): void {
        this.draggedTask = null;
    }
}
