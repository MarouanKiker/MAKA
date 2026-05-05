import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmService } from '../../core/services/crm.service';
import { FinanceService } from '../../core/services/finance.service';
import { Opportunity } from '../../core/models/crm.model';
import { FactureRequest, Facture } from '../../core/models/finance.model';

@Component({
    selector: 'app-opportunities',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './opportunities.component.html',
    styleUrls: ['../shared/crm-page.scss', './opportunities.component.scss']
})
export class OpportunitiesComponent implements OnInit {

    // colonnes du kanban pipeline
    columns = [
        { key: 'NOUVELLE', label: 'Nouvelle', color: '#4a9eff' },
        { key: 'EN_COURS', label: 'En cours', color: '#f5c748' },
        { key: 'GAGNEE', label: 'Gagnée', color: '#44d492' },
        { key: 'PERDUE', label: 'Perdue', color: '#f06c62' },
    ];

    opportunities: Opportunity[] = [];
    draggedOpp: Opportunity | null = null;
    
    message = '';
    isFacturing = false;

    constructor(private crm: CrmService, private finance: FinanceService) { }

    ngOnInit(): void {
        this.loadOpportunities();
    }

    loadOpportunities(): void {
        this.crm.getOpportunities().subscribe({
            next: (data) => this.opportunities = data,
            error: (err) => console.error('Erreur chargement opportunites', err)
        });
    }

    getByStatut(statut: string): Opportunity[] {
        return this.opportunities.filter(o => o.statut === statut);
    }

    // --- drag & drop ---
    onDragStart(opp: Opportunity): void {
        this.draggedOpp = opp;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(event: DragEvent, statut: string): void {
        event.preventDefault();
        if (this.draggedOpp) {
            const currentOpp = this.draggedOpp;
            const oldStatut = currentOpp.statut;
            
            if (oldStatut !== statut) {
                currentOpp.statut = statut;
                
                if (statut === 'GAGNEE' || statut === 'PERDUE') {
                    currentOpp.dateCloture = new Date().toISOString();
                }

                this.crm.updateOpportunity(currentOpp.id, { 
                    statut: statut, 
                    titre: currentOpp.titre, 
                    valeur: currentOpp.valeur,
                    dateCloture: currentOpp.dateCloture
                }).subscribe({
                    next: () => {},
                    error: (err) => {
                        console.error('Erreur maj statut opportunite', err);
                        currentOpp.statut = oldStatut; // revert
                    }
                });
            }
            this.draggedOpp = null;
        }
    }

    onDragEnd(): void {
        this.draggedOpp = null;
    }

    showMessage(msg: string): void {
        this.message = msg;
        setTimeout(() => this.message = '', 4000);
    }

    creerFactureFromOpp(opp: Opportunity): void {
        if (this.isFacturing) return;
        this.isFacturing = true;
        
        const now = new Date();
        const echeance = new Date();
        echeance.setDate(echeance.getDate() + 30); // Echéance dans 30 jours
        
        const req: FactureRequest = {
            numero: `FAC-CRM-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
            clientNom: opp.titre,
            dateEcheance: echeance.toISOString().split('T')[0],
            tauxTVA: 0.20,
            taxe: 0,
            lignes: [{
                produit: 'Prestation liée à : ' + opp.titre,
                quantite: 1,
                prixUnitaire: opp.valeur
            }]
        };

        this.finance.createFacture(req).subscribe({
            next: (createdFacture) => {
                this.showMessage('Facture générée avec succès ! Téléchargement en cours...');
                this.isFacturing = false;
                this.generatePDF(createdFacture);
            },
            error: (err) => {
                console.error('Erreur facture', err);
                this.showMessage('Erreur lors de la génération de la facture.');
                this.isFacturing = false;
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
