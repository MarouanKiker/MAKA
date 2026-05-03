import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrService } from '../../../core/services/hr.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employe, Contrat, DemandeConge, FicheDePaie, Reclamation } from '../../../core/models/hr.model';

@Component({
    selector: 'app-espace-employe',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './espace-employe.component.html',
    styleUrls: ['../../shared/crm-page.scss']
})
export class EspaceEmployeComponent implements OnInit {

    user: any;
    monProfil: Employe | null = null;

    mesContrats: Contrat[] = [];
    mesConges: DemandeConge[] = [];
    mesFiches: FicheDePaie[] = [];
    mesReclamations: Reclamation[] = [];

    errorMsg = '';
    successMsg = '';

    // Modals
    showCongeForm = false;
    showReclamationForm = false;

    // Forms
    newConge: Partial<DemandeConge> = {};
    newReclamation: Partial<Reclamation> = {};

    activeTab = 'conges';

    constructor(
        private hr: HrService,
        private auth: AuthService
    ) {}

    ngOnInit(): void {
        this.user = this.auth.getUser();
        if (this.user && this.user.email) {
            this.loadMonProfil(this.user.email);
        } else {
            this.errorMsg = 'Impossible de charger vos informations utilisateur.';
        }
    }

    loadMonProfil(email: string): void {
        this.hr.getEmployeByEmail(email).subscribe({
            next: (emp) => {
                this.monProfil = emp;
                this.loadMyData();
            },
            error: (err) => {
                if (err.status === 404) {
                    this.errorMsg = "Votre compte n'est pas encore lié à un profil employé RH.";
                } else {
                    this.errorMsg = 'Erreur lors du chargement de votre profil RH.';
                }
            }
        });
    }

    loadMyData(): void {
        if (!this.monProfil) return;
        const id = this.monProfil.id;

        this.hr.getMesContrats(id).subscribe({ next: (data) => this.mesContrats = data });
        this.hr.getMesConges(id).subscribe({ next: (data) => this.mesConges = data });
        this.hr.getMesFiches(id).subscribe({ next: (data) => this.mesFiches = data });
        this.hr.getMesReclamations(id).subscribe({ next: (data) => this.mesReclamations = data });
    }

    setTab(tab: string): void {
        this.activeTab = tab;
    }

    // --- Actions ---

    soumettreConge(): void {
        if (!this.monProfil) return;
        this.newConge.employeId = this.monProfil.id;

        this.hr.createDemandeConge(this.newConge).subscribe({
            next: (c) => {
                this.mesConges.unshift(c); // Add to top
                this.showCongeForm = false;
                this.newConge = {};
                this.showMessage('Demande de congé soumise avec succès !');
            },
            error: (err) => this.errorMsg = 'Erreur lors de la soumission du congé.'
        });
    }

    soumettreReclamation(): void {
        if (!this.monProfil) return;
        this.newReclamation.employeId = this.monProfil.id;

        this.hr.createReclamation(this.monProfil.id, this.newReclamation).subscribe({
            next: (r) => {
                this.mesReclamations.unshift(r);
                this.showReclamationForm = false;
                this.newReclamation = {};
                this.showMessage('Réclamation envoyée !');
            },
            error: (err) => this.errorMsg = 'Erreur lors de l\'envoi de la réclamation.'
        });
    }

    showMessage(msg: string): void {
        this.successMsg = msg;
        setTimeout(() => this.successMsg = '', 4000);
    }

    // --- Helpers ---

    getStatutClass(statut: string): string {
        if (statut === 'Validé' || statut === 'Résolu') return 'success';
        if (statut === 'Refusé') return 'danger';
        return 'warning'; // EnAttente, Ouvert
    }

    getMoisLabel(m: number): string {
        const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        return mois[m - 1] || m.toString();
    }

    downloadPdf(f: FicheDePaie): void {
        const doc = new (window as any).jspdf.jsPDF();
        const emp = this.monProfil;

        // 1. En-tête avec Logo
        const logoUrl = 'assets/logo.jpeg';
        const img = new Image();
        img.src = logoUrl;

        img.onload = () => {
            // Logo
            doc.addImage(img, 'JPEG', 15, 10, 30, 20);
            
            // Titre
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('BULLETIN DE PAIE', 120, 20);
            
            doc.setDrawColor(0, 150, 0); 
            doc.setLineWidth(1);
            doc.line(15, 35, 195, 35);

            // 2. Infos Employé
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('INFORMATIONS SALARIÉ', 15, 45);
            doc.setFont(undefined, 'normal');
            
            (doc as any).autoTable({
                startY: 50,
                head: [['Nom & Prénom', 'Matricule', 'Poste', 'Période de paie']],
                body: [[
                    emp?.nom || 'N/A',
                    'EMP-' + (emp?.id || '000'),
                    this.mesContrats[0]?.poste || 'Salarié',
                    `${this.getMoisLabel(f.mois)} ${f.annee}`
                ]],
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
            });

            // 3. Tableau de paie
            const startY = (doc as any).lastAutoTable.finalY + 10;
            
            const columns = [
                { header: 'LIBELLÉ', dataKey: 'libelle' },
                { header: 'BASE', dataKey: 'base' },
                { header: 'TAUX', dataKey: 'taux' },
                { header: 'À PAYER', dataKey: 'gain' },
                { header: 'À RETENIR', dataKey: 'retenue' }
            ];

            const body = [
                { libelle: 'SALAIRE DE BASE', base: f.salaireBrut.toFixed(2), taux: '-', gain: f.salaireBrut.toFixed(2), retenue: '' },
                { libelle: 'COTISATION CNSS', base: f.salaireBrut.toFixed(2), taux: '4.48%', gain: '', retenue: (f.salaireBrut * 0.0448).toFixed(2) },
                { libelle: 'AMO', base: f.salaireBrut.toFixed(2), taux: '2.26%', gain: '', retenue: (f.salaireBrut * 0.0226).toFixed(2) },
                { libelle: 'PRÉLÈVEMENT IGR', base: '-', taux: '10.00%', gain: '', retenue: (f.cotisations - (f.salaireBrut * 0.0674)).toFixed(2) }
            ];

            (doc as any).autoTable({
                startY: startY,
                columns: columns,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [0, 150, 0], textColor: [255, 255, 255] },
                columnStyles: {
                    gain: { halign: 'right' },
                    retenue: { halign: 'right' }
                }
            });

            // 4. Totaux
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            
            doc.setFillColor(240, 240, 240);
            doc.rect(130, finalY, 65, 12, 'F');
            doc.setTextColor(0, 100, 0);
            doc.text(`NET À PAYER :  ${f.salaireNet.toFixed(2)} MAD`, 135, finalY + 8);

            // 5. Bas de page
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('MAKA ERP - Document généré automatiquement', 15, 285);

            // Téléchargement
            doc.save(`bulletin_paie_${emp?.nom}_${f.mois}_${f.annee}.pdf`);
        };

        img.onerror = () => {
            console.error('Erreur chargement logo, génération sans image');
            doc.text('MAKA ERP - BULLETIN DE PAIE', 15, 20);
            doc.save(`bulletin_paie_${f.mois}_${f.annee}.pdf`);
        };
    }
}
