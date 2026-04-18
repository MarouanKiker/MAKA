import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Facture } from '../../core/models/finance.model';

// page de gestion des factures
@Component({
    selector: 'app-factures',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './factures.component.html',
    styleUrls: ['../shared/finance-page.scss', './factures.component.scss']
})
export class FacturesComponent implements OnInit {

    // liste des factures
    factures: Facture[] = [];

    // afficher ou non le formulaire
    showForm = false;

    // champs du formulaire
    numero = '';
    montant = 0;
    tauxTVA = 20;

    // message de retour
    message = '';

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadFactures();
    }

    // charger les factures depuis le backend
    loadFactures(): void {
        this.financeSvc.getFactures().subscribe({
            next: (data) => { this.factures = data; },
            error: () => { this.message = 'Erreur de chargement des factures'; }
        });
    }

    openForm(): void {
        this.numero = 'FAC-' + Date.now();
        this.montant = 0;
        this.tauxTVA = 20;
        this.showForm = true;
    }

    // sauvegarder une nouvelle facture
    save(): void {
        if (!this.numero || this.montant <= 0) return;
        this.financeSvc.createFacture({
            numero: this.numero,
            montant: this.montant,
            tauxTVA: this.tauxTVA,
            statut: 'IMPAYEE'
        }).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Facture creee !';
                this.loadFactures();
            },
            error: () => { this.message = 'Erreur lors de la creation'; }
        });
    }

    // supprimer une facture
    deleteFacture(id: number): void {
        this.financeSvc.deleteFacture(id).subscribe({
            next: () => {
                this.message = 'Facture supprimee';
                this.loadFactures();
            }
        });
    }
}
