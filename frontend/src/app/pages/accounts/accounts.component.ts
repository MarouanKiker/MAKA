import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CrmService } from '../../core/services/crm.service';
import { Account, Contact, CreateAccountPayload, CreateContactPayload } from '../../core/models/crm.model';

@Component({
    selector: 'app-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './accounts.component.html',
    styleUrls: ['../shared/crm-page.scss', './accounts.component.scss']
})
export class AccountsComponent implements OnInit, OnDestroy {

    // --- Gestion du cycle de vie des Observables ---
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    // --- État UI ---
    showForm        = false;
    isLoading       = false;
    isSubmitting    = false;
    errorMsg        = '';

    // --- Panneau Latéral (Side Panel) "Voir Détails" ---
    selectedAccount: Account | null = null;
    showDetailPanel = false;
    detailContacts: Contact[] = [];
    isDetailLoading = false;

    // --- Confirmation Suppression ---
    accountToDelete: Account | null = null;
    showDeleteConfirm = false;

    // --- Données ---
    accounts: Account[] = [];
    total       = 0;
    totalPages  = 1;
    currentPage = 1;
    pageSize    = 9;
    searchFormControl = '';

    // --- Filtres rapides ---
    activeSectorFilter = '';
    availableSectors: string[] = [];

    // --- Expansion contacts dans la carte ---
    expandedAccountId: number | null = null;
    contactsOfSelectedAccount: Contact[] = [];
    isHistoryLoading = false;

    // --- Formulaire Réactif ---
    accountForm!: FormGroup;
    editingAccountId: number | null = null;
    existingContacts: Contact[] = [];
    isExistingContactsLoading = false;

    constructor(public crm: CrmService, private fb: FormBuilder) {}

    ngOnInit(): void {
        this.initForm();
        this.load();
        // Recherche intelligente avec debounce (300ms) pour ne pas surcharger l'API
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(searchTerm => {
            this.currentPage = 1;
            this.load();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initForm(): void {
        this.accountForm = this.fb.group({
            nom:             ['', [Validators.required, Validators.minLength(2)]],
            email:           ['', [Validators.email]],
            telephone:       [''],
            secteurActivite: [''],
            adresse:         [''],
            newContacts:     this.fb.array([])
        });
    }

    get newContacts() {
        return this.accountForm.get('newContacts') as FormArray;
    }

    addNewContact() {
        this.newContacts.push(this.fb.group({
            prenom:    ['', Validators.required],
            nom:       ['', Validators.required],
            email:     ['', Validators.email],
            telephone: [''],
            type:      ['Decideur', Validators.required]
        }));
    }

    removeNewContact(index: number) {
        this.newContacts.removeAt(index);
    }

    // --- Chargement des comptes depuis l'API ---
    load(): void {
        this.isLoading = true;
        this.errorMsg  = '';
        const searchQuery = this.activeSectorFilter
            ? this.activeSectorFilter
            : (this.searchFormControl || undefined);

        this.crm.getAccounts(searchQuery, this.currentPage, this.pageSize)
            .subscribe({
                next: (res) => {
                    this.accounts   = res.data;
                    this.total      = res.total;
                    this.totalPages = res.totalPages;
                    this.isLoading  = false;
                    // Extraction des secteurs uniques pour les filtres rapides
                    const sectors = res.data.map(a => a.secteurActivite).filter(Boolean) as string[];
                    this.availableSectors = [...new Set([...this.availableSectors, ...sectors])];
                },
                error: () => {
                    this.errorMsg  = 'Erreur lors du chargement des comptes.';
                    this.isLoading = false;
                }
            });
    }

    // --- Appelé à chaque frappe dans la barre de recherche ---
    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchFormControl = value;
        this.searchSubject.next(value);
    }

    onSearch(): void {
        this.currentPage = 1;
        this.load();
    }

    // --- Filtre rapide par secteur ---
    filterBySector(sector: string): void {
        this.activeSectorFilter = this.activeSectorFilter === sector ? '' : sector;
        this.currentPage = 1;
        this.load();
    }

    goToPage(p: number): void {
        if (p < 1 || p > this.totalPages) return;
        this.currentPage = p;
        this.load();
    }

    // --- PANNEAU LATÉRAL : Voir les détails d'un compte ---
    openDetailPanel(account: Account): void {
        this.selectedAccount  = account;
        this.showDetailPanel  = true;
        this.isDetailLoading  = true;
        this.detailContacts   = [];

        this.crm.getContacts(account.id).subscribe({
            next: (contacts) => {
                this.detailContacts  = contacts;
                // Correction du bug d'affichage
                if (this.selectedAccount) {
                    this.selectedAccount.nombreContacts = contacts.length;
                }
                const accInList = this.accounts.find(a => a.id === account.id);
                if (accInList) {
                    accInList.nombreContacts = contacts.length;
                }
                this.isDetailLoading = false;
            },
            error: () => { this.isDetailLoading = false; }
        });
    }

    closeDetailPanel(): void {
        this.showDetailPanel = false;
        this.selectedAccount = null;
    }

    // --- Expansion contacts (Avatar Stack) dans la carte ---
    toggleExpand(account: Account): void {
        if (this.expandedAccountId === account.id) {
            this.expandedAccountId = null;
            this.contactsOfSelectedAccount = [];
        } else {
            this.expandedAccountId = account.id;
            this.loadContactsForAccount(account.id);
        }
    }

    loadContactsForAccount(accountId: number): void {
        this.isHistoryLoading = true;
        this.crm.getContacts(accountId).subscribe({
            next: (contacts) => {
                this.contactsOfSelectedAccount = contacts;
                // Correction du bug d'affichage : Mettre à jour le compteur localement
                const account = this.accounts.find(a => a.id === accountId);
                if (account) {
                    account.nombreContacts = contacts.length;
                }
                this.isHistoryLoading = false;
            },
            error: () => { this.isHistoryLoading = false; }
        });
    }

    // --- Retourne les 3 premiers contacts d'un compte pour l'Avatar Stack ---
    getAvatarStack(account: Account): Contact[] {
        if (this.expandedAccountId === account.id) {
            return this.contactsOfSelectedAccount.slice(0, 3);
        }
        return [];
    }

    // --- FORMULAIRE : Ouvrir en création ou édition ---
    openForm(account?: Account): void {
        this.errorMsg = '';
        this.showForm = true;

        if (account) {
            this.editingAccountId = account.id;
            this.accountForm.patchValue({
                nom:             account.nom,
                email:           account.email || '',
                telephone:       account.telephone || '',
                secteurActivite: account.secteurActivite || '',
                adresse:         account.adresse || ''
            });
            this.newContacts.clear();
            this.loadExistingContacts(account.id);
        } else {
            this.editingAccountId = null;
            this.existingContacts = [];
            this.accountForm.reset();
            this.newContacts.clear();
        }
    }

    loadExistingContacts(accountId: number): void {
        this.isExistingContactsLoading = true;
        this.crm.getContacts(accountId).subscribe({
            next: (contacts) => {
                this.existingContacts = contacts;
                this.isExistingContactsLoading = false;
            },
            error: () => { this.isExistingContactsLoading = false; }
        });
    }

    deleteExistingContact(contactId: number): void {
        this.crm.deleteContact(contactId).subscribe({
            next: () => {
                this.existingContacts = this.existingContacts.filter(c => c.id !== contactId);
                const account = this.accounts.find(a => a.id === this.editingAccountId);
                if (account) account.nombreContacts--;
            }
        });
    }

    // --- SAUVEGARDE ---
    save(): void {
        if (this.accountForm.invalid) {
            this.accountForm.markAllAsTouched();
            this.errorMsg = 'Veuillez corriger les erreurs du formulaire.';
            return;
        }

        const values = this.accountForm.value;
        const payload: CreateAccountPayload = {
            nom:             values.nom.trim(),
            email:           values.email?.trim() || undefined,
            telephone:       values.telephone?.trim() || undefined,
            secteurActivite: values.secteurActivite?.trim() || undefined,
            adresse:         values.adresse?.trim() || undefined
        };

        this.isSubmitting = true;
        const req$ = this.editingAccountId
            ? this.crm.updateAccount(this.editingAccountId, payload)
            : this.crm.createAccount(payload);

        req$.pipe(
            switchMap((accountRes: Account) => {
                if (this.newContacts.length > 0) {
                    const contactRequests = this.newContacts.controls.map(control => {
                        const contactPayload: CreateContactPayload = {
                            prenom:    control.value.prenom,
                            nom:       control.value.nom,
                            email:     control.value.email || undefined,
                            telephone: control.value.telephone || undefined,
                            type:      control.value.type,
                            compteId:  accountRes.id
                        };
                        return this.crm.createContact(contactPayload);
                    });
                    return forkJoin(contactRequests);
                }
                return of(null);
            })
        ).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.showForm     = false;
                if (!this.editingAccountId) this.currentPage = 1;
                this.load();
            },
            error: () => {
                this.errorMsg     = 'Erreur lors de la sauvegarde du compte ou de ses contacts liés.';
                this.isSubmitting = false;
            }
        });
    }

    // --- SUPPRESSION avec confirmation visuelle élégante ---
    confirmDelete(account: Account): void {
        this.accountToDelete = account;
        this.showDeleteConfirm = true;
    }

    cancelDelete(): void {
        this.accountToDelete = null;
        this.showDeleteConfirm = false;
    }

    executeDelete(): void {
        if (!this.accountToDelete) return;
        const id = this.accountToDelete.id;
        this.showDeleteConfirm = false;
        this.accountToDelete   = null;

        this.crm.deleteAccount(id).subscribe({
            next: () => this.load(),
            error: () => { this.errorMsg = 'Erreur lors de la suppression.'; }
        });
    }

    // --- Getters utilitaires ---
    get totalContacts(): number {
        return this.accounts.reduce((sum, a) => sum + (a.nombreContacts ?? 0), 0);
    }

    get pages(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // Couleur de l'avatar selon l'index (Avatar Stack)
    avatarColors = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)',
    ];

    getAvatarStyle(index: number): object {
        return { background: this.avatarColors[index % this.avatarColors.length] };
    }
}
