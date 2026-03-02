import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les comptes clients
@Component({
    selector: 'app-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './accounts.component.html',
    styleUrls: ['../shared/crm-page.scss']
})
export class AccountsComponent {

    // afficher ou non le formulaire d'ajout
    showForm = false;
    // texte de recherche
    search = '';

    // champs du formulaire
    nom = '';
    email = '';
    telephone = '';
    responsable = '';

    constructor(public crm: CrmService) { }

    // filtrer les comptes par recherche
    get filtered(): any[] {
        // si pas de recherche, on retourne tous les comptes
        if (!this.search) {
            return this.crm.accounts;
        }
        // sinon on filtre par nom ou email
        let result = [];
        let s = this.search.toLowerCase();
        for (let i = 0; i < this.crm.accounts.length; i++) {
            let account = this.crm.accounts[i];
            if (account.nom.toLowerCase().includes(s) || account.email.toLowerCase().includes(s)) {
                result.push(account);
            }
        }
        return result;
    }

    // ouvrir le formulaire d'ajout (vider les champs)
    openForm(): void {
        this.nom = '';
        this.email = '';
        this.telephone = '';
        this.responsable = '';
        this.showForm = true;
    }

    // sauvegarder un nouveau compte
    save(): void {
        this.crm.addAccount({
            nom: this.nom,
            email: this.email,
            telephone: this.telephone,
            responsable: this.responsable
        });
        this.showForm = false;
    }

    // supprimer un compte
    delete(id: number): void {
        this.crm.deleteAccount(id);
    }
}
