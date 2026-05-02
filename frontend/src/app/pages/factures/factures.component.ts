import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { Facture, FactureRequest, LigneFactureRequest, StatutFacture } from '../../core/models/finance.model';

@Component({
    selector: 'app-factures',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './factures.component.html',
    styleUrls: ['../shared/crm-page.scss', '../shared/finance-page.scss', './factures.component.scss']
})
export class FacturesComponent implements OnInit {

    factures: Facture[] = [];
    showForm = false;
    message = '';
    isLoading = false;

    numero = '';
    tauxTVA = 0.20;
    lignes: LigneFactureRequest[] = [{ produit: '', quantite: 1, prixUnitaire: 0 }];

    statutLabels: Record<StatutFacture, string> = {
        BROUILLON: 'Brouillon',
        VALIDEE: 'Validée',
        ENVOYEE: 'Envoyée',
        PARTIELLEMENT_PAYEE: 'Part. payée',
        PAYEE: 'Payée',
        ANNULEE: 'Annulée'
    };

    statutColors: Record<StatutFacture, string> = {
        BROUILLON: '#a0a0a0',
        VALIDEE: '#4a9eff',
        ENVOYEE: '#f5c748',
        PARTIELLEMENT_PAYEE: '#f5a623',
        PAYEE: '#44d492',
        ANNULEE: '#e84c3d'
    };

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadFactures();
    }

    loadFactures(): void {
        this.isLoading = true;
        this.financeSvc.getFactures().subscribe({
            next: (data) => { this.factures = data; this.isLoading = false; },
            error: () => {
                this.message = 'Erreur de chargement des factures';
                this.isLoading = false;
            }
        });
    }

    openForm(): void {
        const now = new Date();
        this.numero = `FAC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getTime()).slice(-4)}`;
        this.tauxTVA = 0.20;
        this.lignes = [{ produit: '', quantite: 1, prixUnitaire: 0 }];
        this.showForm = true;
        this.message = '';
    }

    addLigne(): void {
        this.lignes.push({ produit: '', quantite: 1, prixUnitaire: 0 });
    }

    removeLigne(index: number): void {
        if (this.lignes.length > 1) this.lignes.splice(index, 1);
    }

    getMontantHTLigne(ligne: LigneFactureRequest): number {
        return ligne.quantite * ligne.prixUnitaire;
    }

    getTotalHT(): number {
        return this.lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire), 0);
    }

    getTotalTTC(): number {
        return this.getTotalHT() * (1 + this.tauxTVA);
    }

    /** Payload compatible Spring : quantités entières, décimaux pour les prix. */
    private buildFactureRequest(): FactureRequest {
        return {
            numero: this.numero.trim(),
            tauxTVA: Number(this.tauxTVA),
            lignes: this.lignes.map(l => ({
                produit: (l.produit || '').trim(),
                quantite: Math.max(1, Math.round(Number(l.quantite))),
                prixUnitaire: Number(l.prixUnitaire)
            }))
        };
    }

    private readError(err: any): string {
        const b = err?.error;
        if (!b) return 'Erreur réseau ou serveur';
        if (typeof b === 'string') return b;
        if (b.detail) return String(b.detail);
        if (b.message) return String(b.message);
        return 'Erreur lors de la création';
    }

    save(): void {
        const request = this.buildFactureRequest();
        if (!request.numero || request.lignes.some(l => !l.produit || l.prixUnitaire <= 0)) {
            this.message = 'Veuillez remplir tous les champs obligatoires.';
            return;
        }
        this.financeSvc.createFacture(request).subscribe({
            next: () => {
                this.showForm = false;
                this.message = 'Facture créée avec succès !';
                this.loadFactures();
            },
            error: (err) => {
                this.message = this.readError(err);
            }
        });
    }

    changeStatut(facture: Facture, statut: StatutFacture): void {
        this.financeSvc.changeStatutFacture(facture.id, statut).subscribe({
            next: (updated) => {
                facture.statut = updated.statut;
                this.message = `Statut mis à jour : ${this.statutLabels[statut]}`;
            },
            error: () => {
                this.message = 'Erreur lors du changement de statut';
            }
        });
    }

    deleteFacture(id: number): void {
        if (!confirm('Supprimer cette facture ?')) return;
        this.financeSvc.deleteFacture(id).subscribe({
            next: () => {
                this.message = 'Facture supprimée';
                this.loadFactures();
            },
            error: () => {
                this.message = 'Impossible de supprimer cette facture';
            }
        });
    }
}
