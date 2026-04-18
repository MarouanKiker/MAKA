import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { CompteBancaire } from '../../core/models/finance.model';

// page de gestion des comptes bancaires
@Component({
    selector: 'app-comptes-bancaires',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './comptes-bancaires.component.html',
    styleUrls: ['../shared/finance-page.scss']
})
export class ComptesBancairesComponent implements OnInit {

    comptes: CompteBancaire[] = [];
    showForm = false;
    iban = '';
    banque = '';
    message = '';

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadComptes();
    }

    loadComptes(): void {
        this.financeSvc.getComptesBancaires().subscribe({
            next: (data) => { this.comptes = data; }
        });
    }

    openForm(): void {
        this.iban = '';
        this.banque = '';
        this.showForm = true;
    }

    save(): void {
        if (!this.iban || !this.banque) return;
        this.financeSvc.createCompteBancaire({
            iban: this.iban,
            banque: this.banque
        }).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Compte bancaire ajoute !';
                this.loadComptes();
            }
        });
    }

    deleteCompte(id: number): void {
        this.financeSvc.deleteCompteBancaire(id).subscribe({
            next: () => { this.message = 'Compte supprime'; this.loadComptes(); }
        });
    }
}
