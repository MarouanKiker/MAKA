import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceService } from '../../core/services/finance.service';
import { CompteBancaire, Paiement } from '../../core/models/finance.model';

// page de gestion des comptes bancaires
@Component({
    selector: 'app-comptes-bancaires',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './comptes-bancaires.component.html',
    styleUrls: ['../shared/finance-page.scss', './comptes-bancaires.component.scss']
})
export class ComptesBancairesComponent implements OnInit {

    comptes: CompteBancaire[] = [];
    /** Paiements validés (pour variation mensuelle réelle par compte). */
    private paiements: Paiement[] = [];
    showForm = false;
    iban = '';
    banque = '';
    message = '';

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.loadComptes();
    }

    loadComptes(): void {
        forkJoin({
            comptes: this.financeSvc.getComptesBancaires(),
            paiements: this.financeSvc.getPaiements()
        }).subscribe({
            next: ({ comptes, paiements }) => {
                this.comptes = comptes;
                this.paiements = paiements;
            },
            error: () => {
                this.financeSvc.getComptesBancaires().subscribe({
                    next: (data) => {
                        this.comptes = data;
                        this.paiements = [];
                    }
                });
            }
        });
    }

    openForm(): void {
        this.iban = '';
        this.banque = '';
        this.showForm = true;
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) {
                this.message = '';
            }
        }, 4000);
    }

    save(): void {
        if (!this.iban || !this.banque) return;
        this.financeSvc.createCompteBancaire({
            iban: this.iban,
            nomBanque: this.banque
        }).subscribe({
            next: () => {
                this.showForm = false;
                this.showMessage('Compte bancaire ajouté !');
                this.loadComptes();
            }
        });
    }

    deleteCompte(id: number): void {
        this.financeSvc.deleteCompteBancaire(id).subscribe({
            next: () => { this.showMessage('Compte supprimé'); this.loadComptes(); }
        });
    }

    totalTresorerie(): number {
        return this.comptes.reduce((s, c) => s + (c.soldeActuel || 0), 0);
    }

    /** Intitulé affiché (la maquette distingue « compte » et banque ; l’API ne fournit que la banque + IBAN). */
    compteIntitule(c: CompteBancaire, index: number): string {
        const d = (c.devise || 'MAD').toUpperCase();
        if (d !== 'MAD' && d !== 'DH' && d !== '') {
            return `Compte Devises ${c.devise}`;
        }
        const labels = [
            'Compte Courant Principal',
            'Compte Épargne Entreprise',
            'Compte Opérations Courantes',
            'Compte Professionnel'
        ];
        return labels[index % labels.length];
    }

    typeLabel(c: CompteBancaire, index: number): string {
        const d = (c.devise || 'MAD').toUpperCase();
        if (d !== 'MAD' && d !== 'DH' && d !== '') {
            return 'Devises';
        }
        return index % 2 === 0 ? 'Courant' : 'Épargne';
    }

    badgeClass(c: CompteBancaire, index: number): string {
        const d = (c.devise || 'MAD').toUpperCase();
        if (d !== 'MAD' && d !== 'DH' && d !== '') {
            return 'cb-badge--devises';
        }
        return index % 2 === 0 ? 'cb-badge--courant' : 'cb-badge--epargne';
    }

    /**
     * Variation % estimée vs début du mois : flux net des paiements validés ce mois / solde estimé en début de mois.
     * Solde début ≈ solde actuel − flux du mois (cohérent si seuls les paiements du mois ont bougé le compte).
     */
    trendMois(c: CompteBancaire): { pct: number; up: boolean } {
        const net = this.netFluxMoisCourant(c);
        const solde = Number(c.soldeActuel) || 0;
        const soldeDebutEstime = solde - net;
        const eps = 0.005;
        let pct = 0;
        if (Math.abs(soldeDebutEstime) > eps) {
            pct = (net / Math.abs(soldeDebutEstime)) * 100;
        } else if (Math.abs(solde) > eps) {
            pct = (net / Math.abs(solde)) * 100;
        }
        pct = Math.round(Math.min(999, Math.max(-999, pct)) * 10) / 10;
        if (Math.abs(net) < eps) {
            pct = 0;
        }
        return { pct, up: net >= -eps };

    }

    private paiementsPourCompte(c: CompteBancaire): Paiement[] {
        return this.paiements.filter(
            p =>
                p.statut === 'VALIDE' &&
                (p.compteBancaireId === c.id ||
                    (p.compteBancaireId == null && p.compteBancaire === c.nomBanque))
        );
    }

    private isDateInCurrentMonth(iso: string | undefined): boolean {
        if (!iso) {
            return false;
        }
        const d = new Date(iso);
        const n = new Date();
        return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    }

    /** Encaissements clients − décaissements fournisseurs, mois civil courant. */
    private netFluxMoisCourant(c: CompteBancaire): number {
        return this.paiementsPourCompte(c)
            .filter(p => this.isDateInCurrentMonth(p.datePaiement))
            .reduce((sum, p) => {
                const m = Number(p.montant) || 0;
                return sum + (p.type === 'CLIENT' ? m : -m);
            }, 0);
    }

    maskIban(iban: string): string {
        const s = (iban || '').replace(/\s/g, '');
        if (s.length < 10) {
            return iban || '—';
        }
        return `${s.slice(0, 4)} ${s.slice(4, 6)} **** **** **** ${s.slice(-4)}`;
    }
}
