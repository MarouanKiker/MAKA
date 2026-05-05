import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { JournalTransaction } from '../../core/models/finance.model';

// page du journal comptable
@Component({
    selector: 'app-journal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './journal.component.html',
    styleUrls: ['../shared/finance-page.scss', './journal.component.scss']
})
export class JournalComponent implements OnInit {

    journal: JournalTransaction[] = [];
    stats: any = { totalCredit: 0, totalDebit: 0, solde: 0 };

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.financeSvc.getJournal().subscribe({
            next: (data) => { this.journal = data; }
        });
        this.financeSvc.getStats().subscribe({
            next: (data) => { this.stats = data; }
        });
    }

    exportCSV(): void {
        if (!this.journal || this.journal.length === 0) return;

        // Utilisation du point-virgule pour compatibilité avec Excel en français
        let csvContent = 'Date;Description;Debit (MAD);Credit (MAD)\n';
        
        this.journal.forEach(j => {
            const date = j.dateEcriture ? new Date(j.dateEcriture).toLocaleString('fr-FR').replace(',', '') : '';
            const descStr = j.description || '';
            const description = `"${descStr.replace(/"/g, '""')}"`;
            const debit = (j.debit || 0).toFixed(2);
            const credit = (j.credit || 0).toFixed(2);
            
            csvContent += `${date};${description};${debit};${credit}\n`;
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
