import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';

// composant pour gerer les contacts
@Component({
    selector: 'app-contacts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './contacts.component.html',
    styleUrls: ['../shared/crm-page.scss']
})
export class ContactsComponent {

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    nom = '';
    type = 'Decideur';
    adresse = '';
    accountId = 0;

    constructor(public crm: CrmService) { }

    // compter les contacts d'un certain type
    countByType(type: string): number {
        let count = 0;
        for (let i = 0; i < this.crm.contacts.length; i++) {
            if (this.crm.contacts[i].type === type) {
                count++;
            }
        }
        return count;
    }

    // ouvrir le formulaire d'ajout
    openForm(): void {
        this.nom = '';
        this.type = 'Decideur';
        this.adresse = '';
        // prendre le premier compte par defaut
        if (this.crm.accounts.length > 0) {
            this.accountId = this.crm.accounts[0].id;
        } else {
            this.accountId = 0;
        }
        this.showForm = true;
    }

    // sauvegarder un nouveau contact
    save(): void {
        this.crm.addContact({
            nom: this.nom,
            type: this.type,
            adresse: this.adresse,
            accountId: this.accountId
        });
        this.showForm = false;
    }

    // supprimer un contact
    delete(id: number): void {
        this.crm.deleteContact(id);
    }
}
