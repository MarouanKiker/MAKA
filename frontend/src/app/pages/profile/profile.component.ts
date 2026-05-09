import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  
  // Form fields
  firstName = '';
  lastName = '';
  email = '';
  role = '';
  
  // Profile picture
  profilePicture: string | null = null;
  
  // States
  successMessage = '';
  errorMessage = '';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
    if (this.user) {
      this.firstName = this.user.prenom || '';
      this.lastName = this.user.nom || '';
      this.email = this.user.email || '';
      this.role = this.user.roles && this.user.roles.length > 0 ? this.user.roles[0].replace('ROLE_', '') : '';
      
      this.profilePicture = localStorage.getItem(`profile_picture_${this.email}`);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicture = e.target.result;
        // Save to local storage
        if (this.email) {
          localStorage.setItem(`profile_picture_${this.email}`, this.profilePicture!);
          this.successMessage = 'Photo de profil mise à jour avec succès.';
          setTimeout(() => this.successMessage = '', 3000);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (!this.firstName || !this.lastName) {
      this.errorMessage = 'Le nom et le prénom sont requis.';
      return;
    }
    
    // Update local storage user object to simulate backend update
    if (this.user) {
      this.user.prenom = this.firstName;
      this.user.nom = this.lastName;
      
      // We must update the local storage directly
      localStorage.setItem('user', JSON.stringify(this.user));
      
      this.successMessage = 'Profil mis à jour avec succès.';
      this.errorMessage = '';
      
      // Auto-hide success message
      setTimeout(() => this.successMessage = '', 3000);
      
      // Force a reload so the layout updates
      setTimeout(() => window.location.reload(), 500);
    }
  }
}
