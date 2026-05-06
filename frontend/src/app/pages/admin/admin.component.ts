import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserAdmin } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  users: UserAdmin[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  availableRoles = [
    { value: 'ROLE_ADMIN', label: 'Administration Globale' },
    { value: 'ROLE_COMMERCIAL', label: 'Commercial (CRM)' },
    { value: 'ROLE_SUPPORT', label: 'Support (SAV)' },
    { value: 'ROLE_FINANCIER', label: 'Financier' },
    { value: 'ROLE_MAGASINIER', label: 'Magasinier (Stock)' },
    { value: 'ROLE_VENDEUR', label: 'Vendeur (Achats/Ventes)' },
    { value: 'ROLE_ACHETEUR', label: 'Acheteur (Achats/Ventes)' },
    { value: 'ROLE_RH', label: 'Ressources Humaines' },
    { value: 'ROLE_EMPLOYE', label: 'Employe (Base)' },
  ];

  constructor(private adminSvc: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminSvc.getUsers().subscribe({
      next: (res) => {
        this.users = res.users;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  toggleRole(user: UserAdmin, role: string): void {
    let currentRoles = [...user.roles];
    
    if (currentRoles.includes(role)) {
      // retirer le role
      currentRoles = currentRoles.filter(r => r !== role);
    } else {
      // ajouter le role
      currentRoles.push(role);
    }

    // garder au moins le role employe de base
    if (currentRoles.length === 0) {
      currentRoles = ['ROLE_EMPLOYE'];
    }

    // maj visuelle immediate (optimiste)
    const previousRoles = [...user.roles];
    user.roles = currentRoles;

    this.adminSvc.updateRoles(user.id, currentRoles).subscribe({
      next: () => {
        // ok
      },
      error: (err) => {
        user.roles = previousRoles; // erreur -> on remet les anciens roles
        alert(err.error?.error || 'Erreur lors de la mise à jour des roles');
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      this.adminSvc.deleteUser(userId).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error.error || 'Erreur')
      });
    }
  }

  hasRole(userRoles: string[], role: string): boolean {
      return userRoles.includes(role);
  }

  getRoleLabel(roleValue: string): string {
      const found = this.availableRoles.find(r => r.value === roleValue);
      return found ? found.label : roleValue;
  }
}
