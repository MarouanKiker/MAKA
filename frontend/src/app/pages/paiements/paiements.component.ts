import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Paiement, Facture } from '../../core/models/finance.model';

// page de gestion des paiements
@Component({
    selector: 'app-paiements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './paiements.component.html',
    styleUrls: ['../shared/finance-page.scss', './paiements.component.scss']
})
export class PaiementsComponent implements OnInit {

    paiements: Paiement[] = [];
    factures: Facture[] = [];
    showForm = false;

    // champs du formulaire
    montant = 0;
    type = 'CLIENT';
    factureId: number | null = null;

    message = '';

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.financeSvc.getPaiements().subscribe({
            next: (data) => { this.paiements = data; }
        });
        this.financeSvc.getFactures().subscribe({
            next: (data) => { this.factures = data; }
        });
    }

    openForm(): void {
        this.montant = 0;
        this.type = 'CLIENT';
        this.factureId = null;
        this.showForm = true;
    }

    save(): void {
        if (this.montant <= 0) return;
        this.financeSvc.createPaiement({
            montant: this.montant,
            type: this.type,
            factureId: this.factureId || undefined
        }).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Paiement enregistre !';
                this.loadAll();
            },
            error: () => { this.message = 'Erreur'; }
        });
    }

    // trouver le numero de facture par son id
    getFactureNumero(id: number): string {
        for (let i = 0; i < this.factures.length; i++) {
            if (this.factures[i].id === id) return this.factures[i].numero;
        }
        return '-';
    }

    deletePaiement(id: number): void {
        this.financeSvc.deletePaiement(id).subscribe({
            next: () => { this.message = 'Paiement supprime'; this.loadAll(); }
        });
    }
}
