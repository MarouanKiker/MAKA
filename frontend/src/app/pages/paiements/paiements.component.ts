import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Paiement, Facture, CreatePaiementRequest, ModePaiement, CompteBancaire, StatutPaiement } from '../../core/models/finance.model';

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
    modesPaiement: ModePaiement[] = [];
    comptesBancaires: CompteBancaire[] = [];
    showForm = false;
    message = '';
    isLoading = false;

    // Champs du formulaire
    factureId: number | null = null;
    montant = 0;
    modePaiementId: number | null = null;
    compteBancaireId: number | null = null;
    referenceTransaction = '';

    statutColors: Record<string, string> = {
        EN_ATTENTE: '#f5c748',
        VALIDE: '#44d492',
        REJETE: '#e84c3d'
    };
    statutLabels: Record<string, string> = {
        EN_ATTENTE: 'En attente',
        VALIDE: 'Validé',
        REJETE: 'Rejeté'
    };

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadAll();
        this.loadModes();
        this.loadComptes();
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

    loadModes(): void {
        this.financeSvc.getModesPaiement().subscribe({
            next: (data) => { 
                this.modesPaiement = data; 
                if (data.length > 0) this.modePaiementId = data[0].id;
            }
        });
    }

    loadComptes(): void {
        this.financeSvc.getComptesBancaires().subscribe({
            next: (data) => { this.comptesBancaires = data; }
        });
    }

    getEnAttenteCount(): number {
        return this.paiements.filter(p => p.statut === 'EN_ATTENTE').length;
    }

    openForm(): void {
        this.factureId = null;
        this.montant = 0;
        this.compteBancaireId = null;
        this.referenceTransaction = '';
        this.showForm = true;
        this.message = '';
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) {
                this.message = '';
            }
        }, 4000); // Disparaît après 4 secondes
    }

    save(): void {
        if (!this.factureId || !this.modePaiementId || this.montant <= 0) {
            this.showMessage('Veuillez remplir tous les champs.');
            return;
        }
        const request: CreatePaiementRequest = {
            factureId: this.factureId,
            montant: this.montant,
            modePaiementId: this.modePaiementId,
            compteBancaireId: this.compteBancaireId || undefined,
            type: 'CLIENT',
            referenceTransaction: this.referenceTransaction || undefined
        };
        this.financeSvc.createPaiement(request).subscribe({
            next: () => {
                this.showForm = false;
                this.showMessage('Paiement enregistré !');
                this.loadAll();
            },
            error: (err) => {
                this.showMessage(err.error?.message || 'Erreur lors de l\'enregistrement');
            }
        });
    }

    valider(paiement: Paiement): void {
        this.financeSvc.validerPaiement(paiement.id).subscribe({
            next: (updated: Paiement) => { paiement.statut = updated.statut; this.showMessage('Paiement validé !'); },
            error: () => { this.showMessage('Erreur lors de la validation'); }
        });
    }

    rejeter(paiement: Paiement): void {
        this.financeSvc.rejeterPaiement(paiement.id).subscribe({
            next: (updated: Paiement) => { paiement.statut = updated.statut; this.showMessage('Paiement rejeté.'); },
            error: () => { this.showMessage('Erreur lors du rejet'); }
        });
    }

    getFactureNumero(factureId: number): string {
        const f = this.factures.find(f => f.id === factureId);
        return f ? f.numero : `#${factureId}`;
    }
}
