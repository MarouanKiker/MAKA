import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { JournalTransaction, FinanceStats } from '../../core/models/finance.model';

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
    stats: FinanceStats = { totalCredit: 0, totalDebit: 0, solde: 0 };

    constructor(private financeSvc: FinanceService) {}

    ngOnInit(): void {
        this.financeSvc.getJournal().subscribe({
            next: (data) => { this.journal = data; }
        });
        this.financeSvc.getStats().subscribe({
            next: (data) => { this.stats = data; }
        });
    }
}
