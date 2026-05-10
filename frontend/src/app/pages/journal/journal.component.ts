import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { JournalTransaction } from '../../core/models/finance.model';

export interface JournalRowView {
    transaction: JournalTransaction;
    /** Solde cumulé après cette ligne (crédits − débits). */
    balance: number;
}

@Component({
    selector: 'app-journal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './journal.component.html',
    styleUrls: ['../shared/finance-page.scss', './journal.component.scss']
})
export class JournalComponent implements OnInit {

    journal: JournalTransaction[] = [];
    searchQuery = '';
    isLoading = true;
    loadError = false;

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.isLoading = true;
        this.loadError = false;
        this.financeSvc.getJournal().subscribe({
            next: (data) => {
                this.journal = Array.isArray(data) ? data : [];
                this.isLoading = false;
            },
            error: () => {
                this.journal = [];
                this.loadError = true;
                this.isLoading = false;
            }
        });
    }

    /**
     * Totaux dérivés uniquement des écritures renvoyées par l’API (même base que le tableau).
     * Aligné avec la compta : solde = Σ crédits − Σ débits sur les lignes du journal.
     */
    get totals(): { totalDebit: number; totalCredit: number; solde: number } {
        let totalDebit = 0;
        let totalCredit = 0;
        for (const j of this.journal) {
            totalDebit += Number(j.debit) || 0;
            totalCredit += Number(j.credit) || 0;
        }
        return {
            totalDebit,
            totalCredit,
            solde: totalCredit - totalDebit
        };
    }

    /** Écritures triées par date puis filtrées (libellé ou date). */
    private filteredSortedJournal(): JournalTransaction[] {
        const q = this.searchQuery.trim().toLowerCase();
        let rows = [...this.journal].sort(
            (a, b) =>
                new Date(a.dateEcriture).getTime() - new Date(b.dateEcriture).getTime()
        );
        if (q) {
            rows = rows.filter(j => {
                const desc = (j.description || '').toLowerCase();
                const iso = this.formatDateIso(j.dateEcriture);
                const raw = (j.dateEcriture || '').toLowerCase();
                return desc.includes(q) || iso.includes(q) || raw.includes(q);
            });
        }
        return rows;
    }

    get displayRows(): JournalRowView[] {
        let bal = 0;
        return this.filteredSortedJournal().map(j => {
            bal += this.creditOf(j) - this.debitOf(j);
            return { transaction: j, balance: bal };
        });
    }

    formatDateIso(iso: string | undefined): string {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /** Valeurs numériques robustes (JSON peut renvoyer nombre ou chaîne). */
    debitOf(j: JournalTransaction): number {
        return Number(j.debit) || 0;
    }

    creditOf(j: JournalTransaction): number {
        return Number(j.credit) || 0;
    }

    exportCSV(): void {
        if (!this.journal || this.journal.length === 0) return;

        let csvContent = 'Date;Libellé;Débit (MAD);Crédit (MAD);Solde cumulé (MAD)\n';
        this.displayRows.forEach(row => {
            const j = row.transaction;
            const date = this.formatDateIso(j.dateEcriture);
            const descStr = j.description || '';
            const description = `"${descStr.replace(/"/g, '""')}"`;
            const debit = (Number(j.debit) || 0).toFixed(2);
            const credit = (Number(j.credit) || 0).toFixed(2);
            const bal = row.balance.toFixed(2);
            csvContent += `${date};${description};${debit};${credit};${bal}\n`;
        });

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `journal_comptable_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
