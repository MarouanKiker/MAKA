import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Paiement, Facture, CreatePaiementRequest, ModePaiement, StatutPaiement } from '../../core/models/finance.model';

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
    message = '';
    isLoading = false;

    // Champs du formulaire
    factureId: number | null = null;
    montant = 0;
    modePaiement: ModePaiement = 'VIREMENT';
    referenceTransaction = '';

    modesPaiement: ModePaiement[] = ['VIREMENT', 'CARTE_BANCAIRE', 'CHEQUE', 'ESPECES'];
    modeLabels: Record<ModePaiement, string> = {
        VIREMENT: '🏦 Virement',
        CARTE_BANCAIRE: '💳 Carte bancaire',
        CHEQUE: '📝 Chèque',
        ESPECES: '💵 Espèces'
    };

    statutColors: Record<StatutPaiement, string> = {
        EN_ATTENTE: '#f5c748',
        VALIDE: '#44d492',
        REJETE: '#e84c3d'
    };
    statutLabels: Record<StatutPaiement, string> = {
        EN_ATTENTE: 'En attente',
        VALIDE: 'Validé',
        REJETE: 'Rejeté'
    };

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    loadAll(): void {
        this.isLoading = true;
        this.financeSvc.getPaiements().subscribe({
            next: (data) => { this.paiements = data; this.isLoading = false; },
            error: (err) => { console.error('Erreur paiements', err); this.isLoading = false; }
        });
        this.financeSvc.getFactures().subscribe({
            next: (data) => { this.factures = data; }
        });
    }

    openForm(): void {
        this.factureId = null;
        this.montant = 0;
        this.modePaiement = 'VIREMENT';
        this.referenceTransaction = '';
        this.showForm = true;
        this.message = '';
    }

    save(): void {
        if (!this.factureId || this.montant <= 0) {
            this.message = 'Veuillez sélectionner une facture et saisir un montant.';
            return;
        }
        const request: CreatePaiementRequest = {
            factureId: this.factureId,
            montant: this.montant,
            modePaiement: this.modePaiement,
            referenceTransaction: this.referenceTransaction || undefined
        };
        this.financeSvc.createPaiement(request).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Paiement enregistré !';
                this.loadAll();
            },
            error: (err) => {
                console.error('Erreur création paiement', err);
                this.message = err.error?.message || 'Erreur lors de l\'enregistrement';
            }
        });
    }

    valider(paiement: Paiement): void {
        this.financeSvc.validerPaiement(paiement.id).subscribe({
            next: (updated) => { paiement.statut = updated.statut; this.message = 'Paiement validé !'; },
            error: () => { this.message = 'Erreur lors de la validation'; }
        });
    }

    rejeter(paiement: Paiement): void {
        this.financeSvc.rejeterPaiement(paiement.id).subscribe({
            next: (updated) => { paiement.statut = updated.statut; this.message = 'Paiement rejeté.'; },
            error: () => { this.message = 'Erreur lors du rejet'; }
        });
    }

    getFactureNumero(factureId: number): string {
        const f = this.factures.find(f => f.id === factureId);
        return f ? f.numero : `#${factureId}`;
    }
}
