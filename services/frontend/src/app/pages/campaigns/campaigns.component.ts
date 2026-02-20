import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les campagnes marketing
@Component({
    selector: 'app-campaigns',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './campaigns.component.html',
    styleUrls: ['../shared/crm-page.scss']
})
export class CampaignsComponent {

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    nom = '';
    budget = 0;
    dateDebut = '';
    dateFin = '';

    constructor(public crm: CrmService) { }

    // calculer le budget total de toutes les campagnes
    get totalBudget(): number {
        let total = 0;
        for (let i = 0; i < this.crm.campaigns.length; i++) {
            total = total + this.crm.campaigns[i].budget;
        }
        return total;
    }

    // calculer le pourcentage du budget par rapport au max
    getBudgetPercent(budget: number): number {
        // trouver le budget le plus grand
        let max = 1;
        for (let i = 0; i < this.crm.campaigns.length; i++) {
            if (this.crm.campaigns[i].budget > max) {
                max = this.crm.campaigns[i].budget;
            }
        }
        return (budget / max) * 100;
    }

    // ouvrir le formulaire d'ajout
    openForm(): void {
        this.nom = '';
        this.budget = 0;
        this.dateDebut = '';
        this.dateFin = '';
        this.showForm = true;
    }

    // sauvegarder une nouvelle campagne
    save(): void {
        this.crm.addCampaign({
            nom: this.nom,
            budget: this.budget,
            dateDebut: this.dateDebut,
            dateFin: this.dateFin
        });
        this.showForm = false;
    }

    // supprimer une campagne
    delete(id: number): void {
        this.crm.deleteCampaign(id);
    }
}
