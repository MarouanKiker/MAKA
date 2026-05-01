import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CrmService } from '../../core/services/crm.service';
import { Account, Contact, CreateContactPayload } from '../../core/models/crm.model';

@Component({
    selector: 'app-contacts',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './contacts.component.html',
    styleUrls: ['../shared/crm-page.scss', './contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {

    // --- Gestion du cycle de vie des Observables ---
    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    // --- État UI ---
    showForm     = false;
    isLoading    = false;
    isSubmitting = false;
    errorMsg     = '';

    // --- Panneau Latéral Détails ---
    showDetailPanel   = false;
    selectedContact: Contact | null = null;

    // --- Confirmation Suppression ---
    showDeleteConfirm = false;
    contactToDelete: Contact | null = null;

    // --- Données ---
    contacts: Contact[] = [];
    accounts: Account[] = [];
    filterCompteId: number | null = null;
    search = '';

    // --- Filtre rapide par type ---
    activeTypeFilter = '';

    // --- Formulaire Réactif ---
    contactForm!: FormGroup;
    editingContactId: number | null = null;
    readonly types = ['Decideur', 'Technique', 'Commercial', 'Support', 'Autre'];

    // Mapping couleur par type de contact
    readonly typeColors: Record<string, string> = {
        'Decideur':  '#8b5cf6',
        'Technique': '#3b82f6',
        'Commercial':'#10b981',
        'Support':   '#f59e0b',
        'Autre':     '#6b7280'
    };

    constructor(
        public crm: CrmService,
        private fb: FormBuilder,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadAccounts();
        this.loadContacts();

        // Recherche intelligente avec debounce (300ms)
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => this.loadContacts());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initForm(): void {
        this.contactForm = this.fb.group({
            prenom:    ['', [Validators.required, Validators.minLength(2)]],
            nom:       ['', [Validators.required, Validators.minLength(2)]],
            email:     ['', [Validators.email]],
            telephone: [''],
            type:      ['Decideur', Validators.required],
            adresse:   [''],
            compteId:  [null, Validators.required]
        });
    }

    loadAccounts(): void {
        this.crm.getAccounts(undefined, 1, 100).subscribe({
            next: (res) => { this.accounts = res.data; }
        });
    }

    loadContacts(): void {
        this.isLoading = true;
        this.errorMsg  = '';
        this.crm.getContacts(
            this.filterCompteId ?? undefined,
            this.search || undefined
        ).subscribe({
            next: (contacts) => {
                // Filtrage local par type si actif
                this.contacts  = this.activeTypeFilter
                    ? contacts.filter(c => c.type === this.activeTypeFilter)
                    : contacts;
                this.isLoading = false;
            },
            error: () => {
                this.errorMsg  = 'Erreur lors du chargement des contacts.';
                this.isLoading = false;
            }
        });
    }

    // --- Recherche intelligente ---
    onSearchInput(event: Event): void {
        this.search = (event.target as HTMLInputElement).value;
        this.searchSubject.next(this.search);
    }

    onSearch(): void { this.loadContacts(); }

    onFilterChange(): void { this.loadContacts(); }

    // --- Filtre rapide par type ---
    filterByType(type: string): void {
        this.activeTypeFilter = this.activeTypeFilter === type ? '' : type;
        this.loadContacts();
    }

    // --- Couleur du type ---
    getTypeColor(type: string): string {
        return this.typeColors[type] || '#6b7280';
    }

    // --- Trouver le compte lié ---
    getLinkedAccount(compteId: number): Account | undefined {
        return this.accounts.find(a => a.id === compteId);
    }

    // --- Naviguer vers les comptes filtrés sur ce compte ---
    goToAccount(compteId: number): void {
        this.router.navigate(['/accounts'], { queryParams: { filter: compteId } });
    }

    // --- PANNEAU LATÉRAL Détails ---
    openDetailPanel(contact: Contact): void {
        this.selectedContact = contact;
        this.showDetailPanel = true;
    }

    closeDetailPanel(): void {
        this.showDetailPanel = false;
        this.selectedContact = null;
    }

    // --- FORMULAIRE ---
    openForm(contact?: Contact): void {
        this.errorMsg = '';
        this.showForm = true;

        if (contact) {
            this.editingContactId = contact.id;
            this.contactForm.patchValue({
                prenom:    contact.prenom,
                nom:       contact.nom,
                email:     contact.email || '',
                telephone: contact.telephone || '',
                type:      contact.type || 'Decideur',
                adresse:   contact.adresse || '',
                compteId:  contact.compteId
            });
        } else {
            this.editingContactId = null;
            this.contactForm.reset({
                type:     'Decideur',
                compteId: this.accounts.length > 0 ? this.accounts[0].id : null
            });
        }
    }

    save(): void {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            this.errorMsg = 'Veuillez remplir correctement les champs obligatoires.';
            return;
        }

        const values = this.contactForm.value;
        const payload: CreateContactPayload = {
            prenom:    values.prenom.trim(),
            nom:       values.nom.trim(),
            email:     values.email?.trim() || undefined,
            telephone: values.telephone?.trim() || undefined,
            type:      values.type,
            adresse:   values.adresse?.trim() || undefined,
            compteId:  Number(values.compteId)
        };

        this.isSubmitting = true;
        const req$ = this.editingContactId
            ? this.crm.updateContact(this.editingContactId, payload)
            : this.crm.createContact(payload);

        req$.subscribe({
            next: () => {
                this.isSubmitting = false;
                this.showForm     = false;
                this.loadContacts();
            },
            error: (err) => {
                this.errorMsg     = err?.error?.error || 'Erreur lors de la sauvegarde du contact.';
                this.isSubmitting = false;
            }
        });
    }

    // --- SUPPRESSION avec confirmation élégante ---
    confirmDelete(contact: Contact): void {
        this.contactToDelete  = contact;
        this.showDeleteConfirm = true;
    }

    cancelDelete(): void {
        this.contactToDelete  = null;
        this.showDeleteConfirm = false;
    }

    executeDelete(): void {
        if (!this.contactToDelete) return;
        const id = this.contactToDelete.id;
        this.showDeleteConfirm = false;
        this.contactToDelete   = null;

        this.crm.deleteContact(id).subscribe({
            next: () => this.loadContacts(),
            error: () => { this.errorMsg = 'Erreur lors de la suppression.'; }
        });
    }

    // --- Statistiques ---
    countByType(type: string): number {
        return this.contacts.filter(c => c.type === type).length;
    }
}
