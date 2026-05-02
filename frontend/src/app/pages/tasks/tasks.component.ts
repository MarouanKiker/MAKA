import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { Task, CreateTaskDto } from '../../core/models/crm.model';

@Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tasks.component.html',
    styleUrls: ['../shared/crm-page.scss', './tasks.component.scss']
})
export class TasksComponent implements OnInit {

    tasks: Task[] = [];
    showForm = false;
    message = '';

    // Champs du formulaire
    title = '';
    description = '';
    dueDate = '';
    leadId: number | null = null;

    // Colonnes du kanban : false = à faire, true = terminée
    columns = [
        { key: false, label: 'À faire', color: '#4a9eff' },
        { key: true, label: 'Terminée', color: '#44d492' },
    ];

    draggedTask: Task | null = null;

    constructor(private crm: CrmService) {}

    ngOnInit(): void {
        this.loadTasks();
    }

    loadTasks(): void {
        this.crm.getTasks().subscribe({
            next: (data) => this.tasks = data,
            error: (err) => {
                console.error('Erreur chargement tâches', err);
                this.message = 'Erreur de chargement des tâches';
            }
        });
    }

    getByCompleted(isCompleted: boolean): Task[] {
        return this.tasks.filter(t => t.isCompleted === isCompleted);
    }

    openForm(): void {
        this.title = '';
        this.description = '';
        this.dueDate = new Date().toISOString().split('T')[0];
        this.leadId = null;
        this.showForm = true;
        this.message = '';
    }

    save(): void {
        if (!this.title) return;
        const dto: CreateTaskDto = {
            title: this.title,
            description: this.description,
            dueDate: new Date(this.dueDate).toISOString(),
            leadId: this.leadId || null
        };
        this.crm.createTask(dto).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Tâche créée !';
                this.loadTasks();
            },
            error: (err) => {
                console.error('Erreur création tâche', err);
                this.message = 'Erreur lors de la création';
            }
        });
    }

    toggleComplete(task: Task): void {
        const newState = !task.isCompleted;
        this.crm.updateTask(task.id, {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            isCompleted: newState
        }).subscribe({
            next: () => { task.isCompleted = newState; },
            error: (err) => console.error('Erreur mise à jour tâche', err)
        });
    }

    delete(id: number): void {
        this.crm.deleteTask(id).subscribe({
            next: () => { this.tasks = this.tasks.filter(t => t.id !== id); },
            error: (err) => console.error('Erreur suppression tâche', err)
        });
    }

    // --- drag & drop ---
    onDragStart(task: Task): void { this.draggedTask = task; }
    onDragOver(event: DragEvent): void { event.preventDefault(); }

    onDrop(event: DragEvent, isCompleted: boolean): void {
        event.preventDefault();
        if (this.draggedTask && this.draggedTask.isCompleted !== isCompleted) {
            this.toggleComplete(this.draggedTask);
        }
        this.draggedTask = null;
    }

    onDragEnd(): void { this.draggedTask = null; }
}
