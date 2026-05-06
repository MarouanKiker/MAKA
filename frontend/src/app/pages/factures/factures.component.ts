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
    clientNom = '';
    dateEcheance = '';
    tauxTVA = 0.20;
    lignes: LigneFactureRequest[] = [{ produit: '', quantite: 1, prixUnitaire: 0 }];
    today = new Date().toISOString().split('T')[0];

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
            error: (err) => {
                this.message = this.readError(err);
                this.isLoading = false;
            }
        });
    }

    openForm(): void {
        const now = new Date();
        this.numero = `FAC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getTime()).slice(-4)}`;
        this.clientNom = '';
        // Date d'échéance par défaut : +30 jours
        const echeance = new Date();
        echeance.setDate(echeance.getDate() + 30);
        this.dateEcheance = echeance.toISOString().split('T')[0];
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
            clientNom: this.clientNom.trim(),
            dateEcheance: this.dateEcheance || null,
            tauxTVA: Number(this.tauxTVA),
            taxe: 0,
            lignes: this.lignes.map(l => ({
                produit: (l.produit || '').trim(),
                quantite: Math.max(1, Math.round(Number(l.quantite))),
                prixUnitaire: Number(l.prixUnitaire)
            }))
        };
    }

    // --- Stats ---
    getTotalCA(): number {
        return this.factures.reduce((s, f) => s + (f.montantTTC || 0), 0);
    }
    getTotalResteAPayer(): number {
        return this.factures.reduce((s, f) => s + (f.resteAPayer || 0), 0);
    }
    getFacturesEnRetard(): number {
        const today = new Date().toISOString().split('T')[0];
        return this.factures.filter(f => f.dateEcheance && f.dateEcheance < today && f.statut !== 'PAYEE' && f.statut !== 'ANNULEE').length;
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => {
            if (this.message === msg) {
                this.message = '';
            }
        }, 4000);
    }

    private readError(err: any): string {
        const b = err?.error;
        if (!b) return 'Erreur réseau ou serveur';
        if (typeof b === 'string') return b;
        if (b.details && b.details.length > 0) return String(b.details[0]);
        if (b.detail) return String(b.detail);
        if (b.message) return String(b.message);
        return 'Erreur inconnue';
    }

    save(): void {
        const request = this.buildFactureRequest();
        if (!request.numero || request.lignes.some(l => !l.produit || l.prixUnitaire <= 0)) {
            this.showMessage('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        this.financeSvc.createFacture(request).subscribe({
            next: () => {
                this.showForm = false;
                this.showMessage('Facture créée avec succès !');
                this.loadFactures();
            },
            error: (err) => {
                this.showMessage(this.readError(err));
            }
        });
    }

    changeStatut(facture: Facture, statut: StatutFacture): void {
        this.financeSvc.changeStatutFacture(facture.id, statut).subscribe({
            next: (updated) => {
                facture.statut = updated.statut;
                this.showMessage(`Statut mis à jour : ${this.statutLabels[statut]}`);
            },
            error: () => {
                this.showMessage('Erreur lors du changement de statut');
            }
        });
    }

    deleteFacture(id: number): void {
        if (!confirm('Supprimer cette facture ?')) return;
        this.financeSvc.deleteFacture(id).subscribe({
            next: () => {
                this.showMessage('Facture supprimée');
                this.loadFactures();
            },
            error: () => {
                this.showMessage('Impossible de supprimer cette facture');
            }
        });
    }

    generatePDF(facture: Facture): void {
        const doc = new (window as any).jspdf.jsPDF();
        
        // 1. En-tête avec Logo
        const logoUrl = 'assets/logo.jpeg';
        const img = new Image();
        img.src = logoUrl;

        img.onload = () => {
            // Logo
            doc.addImage(img, 'JPEG', 15, 10, 30, 20);
            
            // Titre
            doc.setFontSize(22);
            doc.setTextColor(79, 70, 229); // Indigo 600
            doc.text('FACTURE', 150, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`N° ${facture.numero}`, 150, 26);
            
            doc.setDrawColor(79, 70, 229); 
            doc.setLineWidth(1);
            doc.line(15, 35, 195, 35);

            // 2. Infos Facture & Client
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('FACTURÉ À', 15, 45);
            
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text(facture.clientNom || 'Client Inconnu', 15, 53);

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('DÉTAILS DE LA FACTURE', 110, 45);
            doc.setFont(undefined, 'normal');
            
            (doc as any).autoTable({
                startY: 48,
                head: [['Date création', 'Échéance']],
                body: [[
                    new Date(facture.dateCreation).toLocaleDateString('fr-FR'),
                    facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : 'N/A'
                ]],
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
                margin: { left: 110, right: 15 } // Placer le petit tableau à droite
            });

            // 3. Tableau des lignes de facture
            const startY = (doc as any).lastAutoTable.finalY + 15;
            
            const columns = [
                { header: 'DESCRIPTION', dataKey: 'desc' },
                { header: 'QUANTITÉ', dataKey: 'qte' },
                { header: 'PRIX UNITAIRE', dataKey: 'pu' },
                { header: 'MONTANT HT', dataKey: 'total' }
            ];

            const body = (facture.lignes || []).map(l => ({
                desc: l.produit,
                qte: l.quantite.toString(),
                pu: `${l.prixUnitaire.toFixed(2)} MAD`,
                total: `${(l.quantite * l.prixUnitaire).toFixed(2)} MAD`
            }));

            (doc as any).autoTable({
                startY: startY,
                columns: columns,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
                columnStyles: {
                    qte: { halign: 'center' },
                    pu: { halign: 'right' },
                    total: { halign: 'right' }
                }
            });

            // 4. Totaux
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text('Total HT :', 130, finalY);
            doc.text(`${facture.montantHT.toFixed(2)} MAD`, 195, finalY, { align: 'right' });
            
            doc.text(`TVA (${(facture.tauxTVA * 100).toFixed(0)}%) :`, 130, finalY + 6);
            doc.text(`${facture.montantTVA.toFixed(2)} MAD`, 195, finalY + 6, { align: 'right' });
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(240, 240, 240);
            doc.rect(125, finalY + 10, 75, 12, 'F');
            doc.setTextColor(79, 70, 229);
            doc.text('TOTAL TTC :', 130, finalY + 18);
            doc.text(`${facture.montantTTC.toFixed(2)} MAD`, 195, finalY + 18, { align: 'right' });

            // 5. Bas de page
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont(undefined, 'normal');
            doc.text('MAKA ERP - Document généré automatiquement', 15, 285);

            // Téléchargement
            doc.save(`${facture.numero}.pdf`);
        };

        img.onerror = () => {
            console.error('Erreur chargement logo, génération sans image');
            doc.text(`FACTURE ${facture.numero}`, 15, 20);
            doc.save(`${facture.numero}.pdf`);
        };
    }
}
