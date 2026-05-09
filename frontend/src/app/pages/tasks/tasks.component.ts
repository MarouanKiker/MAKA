import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CrmService } from '../../core/services/crm.service';
import { HrService } from '../../core/services/hr.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Task, CreateTaskDto, Lead } from '../../core/models/crm.model';
import { Employe } from '../../core/models/hr.model';

@Component({
    selector: 'app-tasks',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tasks.component.html',
    styleUrls: ['../shared/crm-page.scss', './tasks.component.scss']
})
export class TasksComponent implements OnInit {

    tasks: any[] = [];
    leads: Lead[] = [];
    employes: Employe[] = [];
    showForm = false;
    message = '';

    // Champs du formulaire
    title = '';
    description = '';
    dueDate = '';
    leadId: number | null = null;
    assignedToId: number | null = null;
    priority = 'MOYENNE'; // BASSE, MOYENNE, HAUTE

    // Colonnes du kanban : false = à faire, true = terminée
    columns = [
        { key: false, label: 'À faire', color: '#4a9eff' },
        { key: true, label: 'Terminée', color: '#44d492' },
    ];

    draggedTask: Task | null = null;
    loading = false;

    constructor(
        private crm: CrmService,
        private hr: HrService,
        private confirmService: ConfirmService
    ) {}

    ngOnInit(): void {
        this.loadTasks();
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) {
                this.message = '';
            }
        }, 4000);
    }

    loadTasks(): void {
        this.loading = true;
        forkJoin({
            tasks: this.crm.getTasks(),
            leads: this.crm.getLeads(),
            employes: this.hr.getEmployes()
        }).subscribe({
            next: (data) => {
                this.leads = data.leads;
                this.employes = data.employes;
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                this.tasks = data.tasks.map(t => {
                    // Parser la priorité depuis le titre
                    let parsedPriority = 'MOYENNE';
                    let cleanTitle = t.title;
                    if (t.title.startsWith('[HAUTE] ')) { parsedPriority = 'HAUTE'; cleanTitle = t.title.substring(8); }
                    else if (t.title.startsWith('[MOYENNE] ')) { parsedPriority = 'MOYENNE'; cleanTitle = t.title.substring(10); }
                    else if (t.title.startsWith('[BASSE] ')) { parsedPriority = 'BASSE'; cleanTitle = t.title.substring(8); }

                    // Parser l'assignation depuis la description (ex: "[ASSIGN:5] Faire ceci")
                    let cleanDesc = t.description || '';
                    let assignedName = null;
                    if (cleanDesc.startsWith('[ASSIGN:')) {
                        const endIdx = cleanDesc.indexOf(']');
                        if (endIdx > 8) {
                            const empId = parseInt(cleanDesc.substring(8, endIdx));
                            const emp = this.employes.find(e => e.id === empId);
                            if (emp) assignedName = emp.nom;
                            cleanDesc = cleanDesc.substring(endIdx + 1).trim();
                        }
                    }

                    // Trouver le lead associé
                    const lead = t.leadId ? this.leads.find(l => l.id === t.leadId) : null;
                    
                    // Vérifier si en retard
                    const taskDate = new Date(t.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    const isOverdue = !t.isCompleted && taskDate < today;

                    return {
                        ...t,
                        uiTitle: cleanTitle,
                        uiDescription: cleanDesc,
                        uiPriority: parsedPriority,
                        uiLeadName: lead ? lead.source : null,
                        uiAssignedToName: assignedName,
                        isOverdue: isOverdue
                    };
                });
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement', err);
                this.showMessage('Erreur de chargement des données');
                this.loading = false;
            }
        });
    }

    getByCompleted(isCompleted: boolean): Task[] {
        return this.tasks.filter(t => t.isCompleted === isCompleted);
    }

    openForm(): void {
        this.title = '';
        this.description = '';
        this.priority = 'MOYENNE';
        this.dueDate = new Date().toISOString().split('T')[0];
        this.leadId = null;
        this.assignedToId = null;
        this.showForm = true;
        this.message = '';
    }

    save(): void {
        if (!this.title) return;
        
        // Ajouter la priorité au titre pour le backend
        const fullTitle = `[${this.priority}] ${this.title}`;
        
        // Encoder l'assignation dans la description
        let finalDesc = this.description;
        if (this.assignedToId) {
            finalDesc = `[ASSIGN:${this.assignedToId}] ${this.description}`;
        }

        const dto: CreateTaskDto = {
            title: fullTitle,
            description: finalDesc,
            dueDate: new Date(this.dueDate).toISOString(),
            leadId: this.leadId || null
        };
        this.crm.createTask(dto).subscribe({
            next: () => {
                this.showForm = false;
                this.showMessage('Tâche créée !');
                this.loadTasks();
            },
            error: (err) => {
                console.error('Erreur création tâche', err);
                this.showMessage('Erreur lors de la création');
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
        this.confirmService.ask({
            title: 'Supprimer la tâche',
            message: 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
            confirmText: 'Oui, supprimer',
            cancelText: 'Annuler',
            type: 'danger',
            onConfirm: () => {
                this.crm.deleteTask(id).subscribe({
                    next: () => { this.tasks = this.tasks.filter(t => t.id !== id); },
                    error: (err) => console.error('Erreur suppression tâche', err)
                });
            }
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
