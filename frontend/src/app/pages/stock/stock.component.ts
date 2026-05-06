import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { Article, Depot, MouvementStock, Inventaire, InventaireLine } from '../../core/models/stock.models';

type ModalType =
  | 'ENTREE' | 'SORTIE' | 'TRANSFERT'
  | 'ARTICLE_CREATE' | 'ARTICLE_EDIT'
  | 'DEPOT_CREATE' | 'DEPOT_EDIT'
  | 'INVENTAIRE_START' | 'INVENTAIRE_DETAILS'
  | 'MOUVEMENT_DETAILS'
  | 'CONFIRM_DELETE'
  | null;

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss']
})
export class StockComponent implements OnInit {
  private svc = inject(StockService);
  private fb = inject(FormBuilder);

  // ─── Data ────────────────────────────────────────────────────────────────
  articles: Article[] = [];
  alertes: Article[] = [];
  depots: Depot[] = [];
  mouvements: MouvementStock[] = [];
  inventaires: Inventaire[] = [];
  selectedArticleStocks: any[] = [];
  selectedArticleId: number | null = null;
  selectedInventaire: Inventaire | null = null;
  selectedMouvement: MouvementStock | null = null;
  mouvementLignes: any[] = [];

  // ─── UI state ────────────────────────────────────────────────────────────
  activeTab: 'articles' | 'mouvements' | 'depots' | 'alertes' | 'inventaires' = 'articles';
  modalType: ModalType = null;
  showModal = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Deletion tracking
  deleteTarget: { type: 'article' | 'depot' | 'mouvement'; id: number; label: string } | null = null;

  // Editing tracking
  editArticle: Article | null = null;
  editDepot: Depot | null = null;

  // ─── Forms ───────────────────────────────────────────────────────────────
  mvtForm: FormGroup;
  articleForm: FormGroup;
  depotForm: FormGroup;

  constructor() {
    this.mvtForm = this.fb.group({
      articleId: ['', Validators.required],
      typeMvt:   ['', Validators.required],
      quantite:  [1, [Validators.required, Validators.min(1)]],
      depotSourceId:      [null],
      depotDestinationId: [null],
      motif:     [''],
      sourceType:['MANUEL']
    });

    this.articleForm = this.fb.group({
      reference:       ['', Validators.required],
      designation:     ['', Validators.required],
      description:     [''],
      unite:           ['PIECE', Validators.required],
      prixAchat:       [0, [Validators.required, Validators.min(0)]],
      prixVente:       [0, [Validators.required, Validators.min(0)]],
      seuilMinAlerte:  [5, [Validators.required, Validators.min(0)]],
      emplacementRayon:['']
    });

    this.depotForm = this.fb.group({
      nom:         ['', Validators.required],
      adresse:     [''],
      capaciteMax: [1000, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() { this.loadData(); }

  // ─── Load ─────────────────────────────────────────────────────────────────
  loadData() {
    this.loading = true;
    this.svc.getArticles().subscribe({
      next: r => { this.articles = r.data?.data || []; this.loading = false; },
      error: () => this.loading = false
    });
    this.svc.getAlertes().subscribe({ next: r => this.alertes = r.data || [] });
    this.svc.getDepots().subscribe({ next: r => this.depots = r.data || [] });
    this.svc.getMouvements().subscribe({ next: r => this.mouvements = r.data?.data || [] });
    this.svc.getInventaires().subscribe({ next: r => this.inventaires = r.data || [] });
  }

  setTab(tab: typeof this.activeTab) { this.activeTab = tab; }

  // ─── Modals ───────────────────────────────────────────────────────────────
  openModal(type: ModalType, payload?: any) {
    this.errorMsg = '';
    this.modalType = type;
    this.showModal = true;

    if (type === 'ENTREE' || type === 'SORTIE' || type === 'TRANSFERT') {
      this.mvtForm.reset({ quantite: 1, sourceType: 'MANUEL', typeMvt: type });
    }

    if (type === 'ARTICLE_EDIT' && payload) {
      this.editArticle = payload;
      this.articleForm.patchValue(payload);
    } else if (type === 'ARTICLE_CREATE') {
      this.editArticle = null;
      this.articleForm.reset({ unite: 'PIECE', prixAchat: 0, prixVente: 0, seuilMinAlerte: 5 });
    }

    if (type === 'DEPOT_EDIT' && payload) {
      this.editDepot = payload;
      this.depotForm.patchValue(payload);
    } else if (type === 'DEPOT_CREATE') {
      this.editDepot = null;
      this.depotForm.reset({ capaciteMax: 1000 });
    }
  }

  closeModal() {
    this.showModal = false;
    this.modalType = null;
    this.errorMsg = '';
    this.deleteTarget = null;
    this.editArticle = null;
    this.editDepot = null;
    this.selectedInventaire = null;
    this.selectedMouvement = null;
    this.mouvementLignes = [];
  }

  // ─── Success / Error feedback ─────────────────────────────────────────────
  private flash(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3000);
  }

  // ─── MOUVEMENT ────────────────────────────────────────────────────────────
  submitMouvement() {
    if (this.mvtForm.invalid) return;
    const val = this.mvtForm.value;

    // Convertir "" en null pour les dépôts
    const payload = {
      ...val,
      depotSourceId:      val.depotSourceId      ? +val.depotSourceId      : null,
      depotDestinationId: val.depotDestinationId ? +val.depotDestinationId : null,
      articleId:          +val.articleId
    };

    this.svc.createMouvement(payload).subscribe({
      next: () => { this.closeModal(); this.loadData(); this.flash('Mouvement enregistré !'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur lors du mouvement'
    });
  }

  viewMouvementDetails(m: MouvementStock) {
    this.selectedMouvement = m;
    this.mouvementLignes = [];
    this.svc.getMouvementLignes(m.id).subscribe({
      next: r => { this.mouvementLignes = r.data || []; },
      error: () => { this.mouvementLignes = []; }
    });
    this.modalType = 'MOUVEMENT_DETAILS';
    this.showModal = true;
  }

  annulerMouvement(m: MouvementStock) {
    this.deleteTarget = { type: 'mouvement', id: m.id, label: `Mouvement #${m.id} (${m.typeMvt})` };
    this.openModal('CONFIRM_DELETE');
  }

  // ─── ARTICLE ──────────────────────────────────────────────────────────────
  submitArticle() {
    if (this.articleForm.invalid) return;
    const data = this.articleForm.value;
    const call = this.editArticle
      ? this.svc.updateArticle(this.editArticle.id, data)
      : this.svc.createArticle(data);
    call.subscribe({
      next: () => { this.closeModal(); this.loadData(); this.flash(this.editArticle ? 'Article mis à jour !' : 'Article créé !'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur'
    });
  }

  confirmDeleteArticle(a: Article) {
    this.deleteTarget = { type: 'article', id: a.id, label: `Article "${a.reference} — ${a.designation}"` };
    this.openModal('CONFIRM_DELETE');
  }

  // ─── DEPOT ────────────────────────────────────────────────────────────────
  submitDepot() {
    if (this.depotForm.invalid) return;
    const data = this.depotForm.value;
    const call = this.editDepot
      ? this.svc.updateDepot(this.editDepot.id, data)
      : this.svc.createDepot(data);
    call.subscribe({
      next: () => { this.closeModal(); this.loadData(); this.flash(this.editDepot ? 'Dépôt mis à jour !' : 'Dépôt créé !'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur'
    });
  }

  confirmDeleteDepot(d: Depot) {
    this.deleteTarget = { type: 'depot', id: d.id, label: `Dépôt "${d.nom}"` };
    this.openModal('CONFIRM_DELETE');
  }

  // ─── CONFIRM DELETE ───────────────────────────────────────────────────────
  executeDelete() {
    if (!this.deleteTarget) return;
    const { type, id } = this.deleteTarget;
    const obs =
      type === 'article'   ? this.svc.deleteArticle(id)   :
      type === 'depot'     ? this.svc.deleteDepot(id)      :
      type === 'mouvement' ? this.svc.annulerMouvement(id) : null;

    obs?.subscribe({
      next: () => { this.closeModal(); this.loadData(); this.flash('Suppression réussie !'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur lors de la suppression'
    });
  }

  // ─── STOCK PAR DEPOT ─────────────────────────────────────────────────────
  viewStocksByDepot(articleId: number) {
    this.selectedArticleId = articleId;
    this.svc.getStockByDepot(articleId).subscribe(r => this.selectedArticleStocks = r.data);
  }

  // ─── INVENTAIRE ───────────────────────────────────────────────────────────
  demarrerInventaire(depotIdStr: string) {
    const depotId = parseInt(depotIdStr, 10);
    if (!depotId) { this.errorMsg = 'Sélectionnez un dépôt.'; return; }
    this.svc.demarrerInventaire(depotId).subscribe({
      next: () => { this.closeModal(); this.loadData(); this.setTab('inventaires'); this.flash('Inventaire démarré !'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur'
    });
  }

  openInventaireDetails(inv: Inventaire) {
    this.svc.getInventaire(inv.id).subscribe(r => {
      this.selectedInventaire = r.data;
      this.modalType = 'INVENTAIRE_DETAILS';
      this.showModal = true;
    });
  }

  saisirQuantite(line: InventaireLine, event: any) {
    const qty = parseInt(event.target.value, 10);
    if (isNaN(qty) || qty < 0) return;
    this.svc.saisirQuantiteInventaire(line.id, qty).subscribe({
      next: () => { if (this.selectedInventaire) this.openInventaireDetails(this.selectedInventaire); }
    });
  }

  validerInventaireActuel() {
    if (!this.selectedInventaire) return;
    this.svc.validerInventaire(this.selectedInventaire.id).subscribe({
      next: () => { this.closeModal(); this.loadData(); this.flash('Inventaire validé ! Stock ajusté automatiquement.'); },
      error: err => this.errorMsg = err.error?.message || 'Erreur'
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  getDepotName(id: number | undefined): string {
    if (!id) return '—';
    return this.depots.find(d => d.id === id)?.nom || 'Dépôt #' + id;
  }

  getTypeBadge(type: string) {
    return type === 'ENTREE' ? 'badge-success' : type === 'SORTIE' ? 'badge-danger' : 'badge-info';
  }
}
