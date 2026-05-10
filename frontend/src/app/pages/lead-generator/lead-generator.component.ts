import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { catchError, concatMap, from, map, of } from 'rxjs';
import { GoogleScraperComponent } from '../google-scraper/google-scraper.component';
import { CrmService } from '../../core/services/crm.service';
import type { Lead } from '../../core/models/crm.model';

export interface ParsedImportRow {
    rowIndex: number;
    entreprise: string;
    telephone: string;
    website: string;
    email: string;
    valid: boolean;
    skipReason?: string;
}

const ENT_PATTERNS = ['nom entreprise', 'raison sociale', 'entreprise', 'société', 'societe', 'company', 'name'];
const TEL_PATTERNS = ['téléphone', 'telephone', 'tel', 'phone', 'mobile', 'gsm', 'numéro', 'numero'];
const WEB_PATTERNS = ['site web', 'siteweb', 'website', 'url', 'site'];
const EMAIL_PATTERNS = ['e-mail', 'email', 'mail', 'courriel'];

const HEADER_HINTS = [
    ...ENT_PATTERNS,
    ...TEL_PATTERNS,
    ...WEB_PATTERNS,
    ...EMAIL_PATTERNS,
    'web',
    'nom'
];

function normalizeHeader(h: string): string {
    return h
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/_/g, ' ')
        .trim();
}

function findColumn(headers: string[], patterns: string[]): number | null {
    const norm = headers.map((h) => normalizeHeader(String(h ?? '')));
    const sorted = [...patterns].sort((a, b) => b.length - a.length);
    for (let i = 0; i < norm.length; i++) {
        const cell = norm[i];
        if (!cell) {
            continue;
        }
        for (const p of sorted) {
            const pn = normalizeHeader(p);
            if (cell === pn || cell.includes(pn)) {
                return i;
            }
        }
    }
    return null;
}

function headerLooksLikeLabels(cells: string[]): boolean {
    if (cells.length < 2) {
        return false;
    }
    let hits = 0;
    for (const c of cells) {
        const n = normalizeHeader(String(c ?? ''));
        if (!n) {
            continue;
        }
        for (const hint of HEADER_HINTS) {
            if (n.includes(normalizeHeader(hint))) {
                hits++;
                break;
            }
        }
    }
    return hits >= 2;
}

interface ColMap {
    entreprise: number;
    telephone: number;
    website: number;
    email: number;
}

function resolveColumns(headers: string[]): ColMap {
    const e = findColumn(headers, ENT_PATTERNS);
    const t = findColumn(headers, TEL_PATTERNS);
    const w = findColumn(headers, WEB_PATTERNS);
    const em = findColumn(headers, EMAIL_PATTERNS);
    return {
        entreprise: e ?? 0,
        telephone: t ?? 1,
        website: w ?? 2,
        email: em ?? -1
    };
}

function detectDelimiter(line: string): string {
    const semi = (line.match(/;/g) ?? []).length;
    const comma = (line.match(/,/g) ?? []).length;
    return semi >= comma ? ';' : ',';
}

function splitCsvRow(line: string, delim: string): string[] {
    const out: string[] = [];
    let field = '';
    let i = 0;
    let inQ = false;
    while (i < line.length) {
        const c = line[i];
        if (inQ) {
            if (c === '"') {
                if (line[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQ = false;
                i++;
                continue;
            }
            field += c;
            i++;
            continue;
        }
        if (c === '"') {
            inQ = true;
            i++;
            continue;
        }
        if (c === delim) {
            out.push(field.trim());
            field = '';
            i++;
            continue;
        }
        field += c;
        i++;
    }
    out.push(field.trim());
    return out;
}

function parseCsvToMatrix(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) {
        return [];
    }
    const delim = detectDelimiter(lines[0]);
    return lines.map((line) => splitCsvRow(line, delim));
}

function parseXlsxToMatrix(buf: ArrayBuffer): string[][] {
    const wb = XLSX.read(buf, { type: 'array', cellDates: false });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
        raw: false,
        defval: ''
    }) as string[][];
    return raw.map((row) => row.map((c) => String(c ?? '').trim()));
}

function buildParsedRows(matrix: string[][]): ParsedImportRow[] {
    if (!matrix.length) {
        return [];
    }
    const first = matrix[0].map((c) => String(c ?? '').trim());
    const useHeader = headerLooksLikeLabels(first);
    const col: ColMap = useHeader ? resolveColumns(first) : { entreprise: 0, telephone: 1, website: 2, email: 3 };
    const dataRows = useHeader ? matrix.slice(1) : matrix;

    const out: ParsedImportRow[] = [];
    let rowIndex = 0;
    for (const raw of dataRows) {
        const cells = [...raw].map((c) => String(c ?? '').trim());
        while (cells.length < 4) {
            cells.push('');
        }
        const entreprise = (cells[col.entreprise] ?? '').trim();
        const telephone = (cells[col.telephone] ?? '').trim();
        const website = (cells[col.website] ?? '').trim();
        const email = col.email >= 0 ? (cells[col.email] ?? '').trim() : '';

        const allEmpty = !entreprise && !telephone && !website && !email;
        if (allEmpty) {
            continue;
        }

        let skipReason: string | undefined;
        let valid = true;
        if (!entreprise && !website) {
            valid = false;
            skipReason = 'Nom ou site web manquant';
        }

        out.push({
            rowIndex,
            entreprise,
            telephone,
            website,
            email,
            valid,
            skipReason
        });
        rowIndex++;
    }
    return out;
}

@Component({
    selector: 'app-lead-generator',
    standalone: true,
    imports: [CommonModule, GoogleScraperComponent],
    templateUrl: './lead-generator.component.html',
    styleUrls: ['../shared/crm-page.scss', './lead-generator.component.scss']
})
export class LeadGeneratorComponent {
    private readonly crm = inject(CrmService);

    selectedFile: File | null = null;
    readonly acceptedExtensions = ['.xlsx', '.csv'];

    parsedRows: ParsedImportRow[] = [];
    readonly pageSize = 5;
    currentPage = 1;
    parseError: string | null = null;
    isParsing = false;
    bulkImporting = false;
    /** États par index de ligne dans `parsedRows`. */
    leadStatus: Record<number, 'idle' | 'saving' | 'saved' | 'error'> = {};

    formatFileSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} o`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} Ko`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
    }

    countValidPending(): number {
        return this.parsedRows.filter((r, i) => r.valid && this.leadStatus[i] !== 'saved').length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.parsedRows.length / this.pageSize));
    }

    get paginatedRows(): ParsedImportRow[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.parsedRows.slice(start, start + this.pageSize);
    }

    get pageStart(): number {
        return this.parsedRows.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
    }

    get pageEnd(): number {
        return Math.min(this.currentPage * this.pageSize, this.parsedRows.length);
    }

    goToPage(page: number): void {
        this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    private async acceptFile(file: File | undefined | null): Promise<void> {
        if (!file?.name) {
            return;
        }
        const lower = file.name.toLowerCase();
        const ok = this.acceptedExtensions.some((ext) => lower.endsWith(ext));
        if (!ok) {
            return;
        }
        this.selectedFile = file;
        this.parseError = null;
        this.parsedRows = [];
        this.currentPage = 1;
        this.leadStatus = {};
        await this.parseSelectedFile(file);
    }

    private async parseSelectedFile(file: File): Promise<void> {
        this.isParsing = true;
        try {
            let matrix: string[][] = [];
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                matrix = parseCsvToMatrix(text);
            } else {
                const buf = await file.arrayBuffer();
                matrix = parseXlsxToMatrix(buf);
            }
            this.parsedRows = buildParsedRows(matrix);
            this.currentPage = 1;
            if (!this.parsedRows.length) {
                this.parseError = 'Aucune ligne exploitable dans ce fichier.';
            }
        } catch (e) {
            console.error('Erreur parsing import leads', e);
            this.parseError =
                'Impossible de lire ce fichier. Vérifiez le format (.csv UTF-8 ou .xlsx) et réessayez.';
            this.parsedRows = [];
        } finally {
            this.isParsing = false;
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer?.files?.[0];
        void this.acceptFile(file);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        void this.acceptFile(file);
        input.value = '';
    }

    removeFile(): void {
        this.selectedFile = null;
        this.parsedRows = [];
        this.currentPage = 1;
        this.parseError = null;
        this.leadStatus = {};
        this.bulkImporting = false;
    }

    addRow(rowIndex: number): void {
        const row = this.parsedRows[rowIndex];
        if (!row?.valid || this.leadStatus[rowIndex] === 'saving' || this.leadStatus[rowIndex] === 'saved') {
            return;
        }
        this.leadStatus[rowIndex] = 'saving';
        const lead = this.buildLead(row);
        this.crm.createLead(lead).subscribe({
            next: () => {
                this.leadStatus[rowIndex] = 'saved';
            },
            error: (err) => {
                console.error('Erreur création lead import fichier', err);
                this.leadStatus[rowIndex] = 'error';
            }
        });
    }

    addAllPending(): void {
        const indices = this.parsedRows
            .map((r, i) => ({ r, i }))
            .filter(({ r, i }) => r.valid && this.leadStatus[i] !== 'saved' && this.leadStatus[i] !== 'saving')
            .map(({ i }) => i);
        if (!indices.length || this.bulkImporting) {
            return;
        }
        this.bulkImporting = true;
        from(indices)
            .pipe(
                concatMap((i) => {
                    this.leadStatus[i] = 'saving';
                    const lead = this.buildLead(this.parsedRows[i]);
                    return this.crm.createLead(lead).pipe(
                        map(() => {
                            this.leadStatus[i] = 'saved';
                            return null;
                        }),
                        catchError((err) => {
                            console.error('Erreur création lead import fichier (lot)', err);
                            this.leadStatus[i] = 'error';
                            return of(null);
                        })
                    );
                })
            )
            .subscribe({
                complete: () => {
                    this.bulkImporting = false;
                },
                error: () => {
                    this.bulkImporting = false;
                }
            });
    }

    getLeadButtonLabel(rowIndex: number): string {
        const status = this.leadStatus[rowIndex];
        if (status === 'saving') {
            return 'Ajout...';
        }
        if (status === 'saved') {
            return 'Ajouté';
        }
        if (status === 'error') {
            return 'Réessayer';
        }
        return 'Ajouter au CRM';
    }

    private buildLead(row: ParsedImportRow): Partial<Lead> {
        const name =
            row.entreprise.trim() ||
            this.hostnameFromWebsite(row.website) ||
            'Prospect import';
        const src = `Import — ${name}`.slice(0, 100);
        return {
            source: src,
            entreprise: name.slice(0, 200),
            nomContact: name.slice(0, 200),
            email: (row.email || '').slice(0, 200),
            telephone: this.normalizeTelephone(row.telephone),
            score: 55,
            campagneId: null
        };
    }

    private hostnameFromWebsite(raw: string): string {
        const s = raw.trim();
        if (!s) {
            return '';
        }
        try {
            const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
            return new URL(url).hostname.replace(/^www\./i, '');
        } catch {
            return s.slice(0, 80);
        }
    }

    private normalizeTelephone(raw: string | undefined): string {
        const s = (raw ?? '').trim().replace(/\s+/g, ' ');
        return s.length > 50 ? s.slice(0, 50) : s;
    }
}
