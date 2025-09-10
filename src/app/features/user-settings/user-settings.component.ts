import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface UserProfile {
  fullName: string;
  email: string;
  profileImage: string;
  status: 'online' | 'away' | 'busy' | 'invisible';
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
}

interface RecognizedDevice {
  id: string;
  name: string;
  type: string;
  lastSeen: Date;
  trusted: boolean;
}

interface BlockedUser {
  id: string;
  username: string;
  blockedDate: Date;
}

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h1>{{ currentLanguage === 'fr' ? 'Paramètres' : 'User Settings' }}</h1>
      </div>

      <div class="settings-content">
        <!-- Profile Section -->
        <div class="settings-card">
          <h2>{{ currentLanguage === 'fr' ? 'Profil' : 'Profile' }}</h2>
          
          <div class="profile-image-section">
            <div class="profile-image-container">
              <img [src]="userProfile.profileImage" [alt]="userProfile.fullName" class="profile-image">
              <div class="profile-image-overlay" (click)="triggerImageUpload()">
                <span>{{ currentLanguage === 'fr' ? 'Changer' : 'Change' }}</span>
              </div>
            </div>
            <input #imageUpload type="file" (change)="onImageUpload($event)" accept="image/*" style="display: none;">
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Nom complet' : 'Full Name' }}</label>
            <input 
              type="text" 
              [(ngModel)]="userProfile.fullName" 
              [disabled]="!editingName"
              class="form-control">
            <button (click)="toggleEditName()" class="btn-secondary">
              {{ editingName ? (currentLanguage === 'fr' ? 'Sauver' : 'Save') : (currentLanguage === 'fr' ? 'Éditer' : 'Edit') }}
            </button>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Email' : 'Email' }}</label>
            <input type="email" [value]="userProfile.email" readonly class="form-control readonly">
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Statut' : 'Status' }}</label>
            <select [(ngModel)]="userProfile.status" class="form-control">
              <option value="online">{{ currentLanguage === 'fr' ? 'En ligne' : 'Online' }}</option>
              <option value="away">{{ currentLanguage === 'fr' ? 'Absent' : 'Away' }}</option>
              <option value="busy">{{ currentLanguage === 'fr' ? 'Occupé' : 'Busy' }}</option>
              <option value="invisible">{{ currentLanguage === 'fr' ? 'Invisible' : 'Invisible' }}</option>
            </select>
          </div>
        </div>

        <!-- Account Section -->
        <div class="settings-card">
          <h2>{{ currentLanguage === 'fr' ? 'Compte' : 'Account' }}</h2>
          
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <div class="form-group">
              <label>{{ currentLanguage === 'fr' ? 'Mot de passe actuel' : 'Current Password' }}</label>
              <input type="password" formControlName="currentPassword" class="form-control"
                [class.error]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">
              <div *ngIf="passwordForm.get('currentPassword')?.errors?.['required'] && passwordForm.get('currentPassword')?.touched" 
                class="error-message">{{ currentLanguage === 'fr' ? 'Requis' : 'Required' }}</div>
            </div>

            <div class="form-group">
              <label>{{ currentLanguage === 'fr' ? 'Nouveau mot de passe' : 'New Password' }}</label>
              <input type="password" formControlName="newPassword" class="form-control"
                [class.error]="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">
              <div *ngIf="passwordForm.get('newPassword')?.errors?.['required'] && passwordForm.get('newPassword')?.touched" 
                class="error-message">{{ currentLanguage === 'fr' ? 'Requis' : 'Required' }}</div>
              <div *ngIf="passwordForm.get('newPassword')?.errors?.['minlength'] && passwordForm.get('newPassword')?.touched" 
                class="error-message">{{ currentLanguage === 'fr' ? 'Minimum 8 caractères' : 'Minimum 8 characters' }}</div>
            </div>

            <div class="form-group">
              <label>{{ currentLanguage === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Password' }}</label>
              <input type="password" formControlName="confirmPassword" class="form-control"
                [class.error]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched">
              <div *ngIf="passwordForm.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched" 
                class="error-message">{{ currentLanguage === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match' }}</div>
            </div>

            <button type="submit" [disabled]="passwordForm.invalid" class="btn-primary">
              {{ currentLanguage === 'fr' ? 'Changer le mot de passe' : 'Change Password' }}
            </button>
          </form>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Sessions actives' : 'Active Sessions' }}</label>
            <div class="sessions-list">
              <div *ngFor="let session of activeSessions" class="session-item">
                <div class="session-info">
                  <strong>{{ session.device }}</strong>
                  <span class="session-location">{{ session.location }}</span>
                  <span class="session-time">{{ currentLanguage === 'fr' ? 'Dernière activité:' : 'Last active:' }} {{ session.lastActive | date:'short' }}</span>
                  <span *ngIf="session.current" class="current-session">{{ currentLanguage === 'fr' ? 'Session actuelle' : 'Current session' }}</span>
                </div>
                <button *ngIf="!session.current" (click)="logoutSession(session.id)" class="btn-danger btn-small">
                  {{ currentLanguage === 'fr' ? 'Déconnecter' : 'Logout' }}
                </button>
              </div>
            </div>
          </div>

          <div class="danger-zone">
            <h3>{{ currentLanguage === 'fr' ? 'Zone de danger' : 'Danger Zone' }}</h3>
            <button (click)="showDeleteConfirm = true" class="btn-danger">
              {{ currentLanguage === 'fr' ? 'Supprimer le compte' : 'Delete Account' }}
            </button>
            
            <div *ngIf="showDeleteConfirm" class="confirmation-modal">
              <div class="modal-content">
                <h4>{{ currentLanguage === 'fr' ? 'Confirmer la suppression' : 'Confirm Deletion' }}</h4>
                <p>{{ currentLanguage === 'fr' ? 'Cette action est irréversible. Êtes-vous sûr?' : 'This action is irreversible. Are you sure?' }}</p>
                <div class="modal-actions">
                  <button (click)="showDeleteConfirm = false" class="btn-secondary">
                    {{ currentLanguage === 'fr' ? 'Annuler' : 'Cancel' }}
                  </button>
                  <button (click)="deleteAccount()" class="btn-danger">
                    {{ currentLanguage === 'fr' ? 'Supprimer définitivement' : 'Delete Permanently' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Section -->
        <div class="settings-card">
          <h2>{{ currentLanguage === 'fr' ? 'Préférences' : 'Preferences' }}</h2>
          
          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Langue' : 'Language' }}</label>
            <select [(ngModel)]="currentLanguage" class="form-control">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Mode d\'affichage' : 'Display Mode' }}</label>
            <div class="toggle-group">
              <button 
                (click)="toggleThemeOld('light')" 
                [class.active]="currentTheme === 'light'"
                class="btn-toggle">
                {{ currentLanguage === 'fr' ? 'Clair' : 'Light' }}
              </button>
              <button 
                (click)="toggleThemeOld('dark')" 
                [class.active]="currentTheme === 'dark'"
                class="btn-toggle">
                {{ currentLanguage === 'fr' ? 'Sombre' : 'Dark' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" id="emailNotifs" [(ngModel)]="preferences.emailNotifications">
              <label for="emailNotifs">{{ currentLanguage === 'fr' ? 'Notifications par email' : 'Email Notifications' }}</label>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" id="pushNotifs" [(ngModel)]="preferences.pushNotifications">
              <label for="pushNotifs">{{ currentLanguage === 'fr' ? 'Notifications push' : 'Push Notifications' }}</label>
            </div>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Format de l\'heure' : 'Time Format' }}</label>
            <select [(ngModel)]="preferences.timeFormat" class="form-control">
              <option value="12h">12h</option>
              <option value="24h">24h</option>
            </select>
          </div>
        </div>

        <!-- Security Section -->
        <div class="settings-card">
          <h2>{{ currentLanguage === 'fr' ? 'Sécurité' : 'Security' }}</h2>
          
          <div class="form-group">
            <div class="security-item">
              <div>
                <strong>{{ currentLanguage === 'fr' ? 'Authentification à deux facteurs (2FA)' : 'Two-Factor Authentication (2FA)' }}</strong>
                <p>{{ currentLanguage === 'fr' ? 'Ajoutez une couche de sécurité supplémentaire' : 'Add an extra layer of security' }}</p>
              </div>
              <label class="switch">
                <input type="checkbox" [(ngModel)]="security.twoFactorEnabled">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Appareils reconnus' : 'Recognized Devices' }}</label>
            <div class="devices-list">
              <div *ngFor="let device of recognizedDevices" class="device-item">
                <div class="device-info">
                  <strong>{{ device.name }}</strong>
                  <span class="device-type">{{ device.type }}</span>
                  <span class="device-time">{{ currentLanguage === 'fr' ? 'Dernière connexion:' : 'Last seen:' }} {{ device.lastSeen | date:'short' }}</span>
                  <span *ngIf="device.trusted" class="trusted-device">{{ currentLanguage === 'fr' ? 'Appareil de confiance' : 'Trusted Device' }}</span>
                </div>
                <button (click)="toggleDeviceTrust(device.id)" class="btn-secondary btn-small">
                  {{ device.trusted ? (currentLanguage === 'fr' ? 'Retirer la confiance' : 'Remove Trust') : (currentLanguage === 'fr' ? 'Faire confiance' : 'Trust') }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Alertes de sécurité' : 'Security Alerts' }}</label>
            <div class="alerts-list">
              <div *ngFor="let alert of securityAlerts" class="alert-item" [class]="'alert-' + alert.type">
                <strong>{{ alert.title }}</strong>
                <p>{{ alert.message }}</p>
                <span class="alert-time">{{ alert.timestamp | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Section -->
        <div class="settings-card">
          <h2>{{ currentLanguage === 'fr' ? 'Confidentialité' : 'Privacy' }}</h2>
          
          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Visibilité du profil' : 'Profile Visibility' }}</label>
            <select [(ngModel)]="privacy.profileVisibility" class="form-control">
              <option value="public">{{ currentLanguage === 'fr' ? 'Public' : 'Public' }}</option>
              <option value="friends">{{ currentLanguage === 'fr' ? 'Amis uniquement' : 'Friends Only' }}</option>
              <option value="private">{{ currentLanguage === 'fr' ? 'Privé' : 'Private' }}</option>
            </select>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" id="dataSharing" [(ngModel)]="privacy.dataSharing">
              <label for="dataSharing">{{ currentLanguage === 'fr' ? 'Permettre le partage de données pour améliorer le service' : 'Allow data sharing to improve service' }}</label>
            </div>
          </div>

          <div class="form-group">
            <label>{{ currentLanguage === 'fr' ? 'Utilisateurs bloqués' : 'Blocked Users' }}</label>
            <div class="blocked-users-list">
              <div *ngFor="let user of blockedUsers" class="blocked-user-item">
                <div class="user-info">
                  <strong>{{ user.username }}</strong>
                  <span class="blocked-date">{{ currentLanguage === 'fr' ? 'Bloqué le:' : 'Blocked on:' }} {{ user.blockedDate | date:'short' }}</span>
                </div>
                <button (click)="unblockUser(user.id)" class="btn-secondary btn-small">
                  {{ currentLanguage === 'fr' ? 'Débloquer' : 'Unblock' }}
                </button>
              </div>
            </div>
            
            <div class="add-block-user">
              <input type="text" [(ngModel)]="newBlockUser" placeholder="{{ currentLanguage === 'fr' ? 'Nom d\'utilisateur à bloquer' : 'Username to block' }}" class="form-control">
              <button (click)="blockUser()" [disabled]="!newBlockUser" class="btn-primary">
                {{ currentLanguage === 'fr' ? 'Bloquer' : 'Block' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    .settings-header {
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid var(--border-color);
    }

    .settings-header h1 {
      margin: 0;
      font-size: 21px;
      font-weight: 700;
      color: var(--text-headings);
    }

    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }

    .settings-card {
      background: var(--bg-primary);
      border-radius: 12px;
      padding: 25px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }

    .settings-card:hover {
      box-shadow: var(--shadow-lg);
    }

    .settings-card h2 {
      margin: 0 0 20px 0;
      font-size: 17px;
      font-weight: 600;
      color: var(--text-headings);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }

    .profile-image-section {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }

    .profile-image-container {
      position: relative;
      cursor: pointer;
    }

    .profile-image {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--primary-color, #007bff);
    }

    .profile-image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
      font-size: 0.9rem;
    }

    .profile-image-container:hover .profile-image-overlay {
      opacity: 1;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 14px;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
    }

    .form-control.readonly {
      background-color: var(--bg-tertiary, #f5f5f5);
      color: var(--text-disabled, #AAAAAA);
      cursor: not-allowed;
    }

    /* Dark mode specific styles */
    :host-context([data-theme="dark"]) .form-control.readonly {
      background-color: var(--bg-tertiary);
      color: var(--text-disabled);
    }

    .form-control.error {
      border-color: var(--error-color, #dc3545);
    }

    .error-message {
      color: var(--error-color, #dc3545);
      font-size: 11px; /* Petits détails / footers */
      margin-top: 5px;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px; /* Boutons */
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      background: var(--text-disabled);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--secondary-color);
      color: white;
    }

    .btn-secondary:hover {
      background: var(--secondary-hover);
      transform: translateY(-1px);
    }

    .btn-danger {
      background: var(--error-color);
      color: white;
    }

    .btn-danger:hover {
      background: var(--warning-color);
      transform: translateY(-1px);
    }

    .btn-small {
      padding: 6px 12px;
      font-size: 12px; /* Petits détails / footers */
    }

    .toggle-group {
      display: flex;
      gap: 10px;
    }

    .btn-toggle {
      padding: 8px 16px;
      border: 2px solid var(--border-color, #ddd);
      border-radius: 6px;
      background: var(--bg-primary, #ffffff);
      color: var(--text-primary, #333333);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-toggle.active {
      border-color: var(--primary-color, #007bff);
      background: var(--primary-color, #007bff);
      color: white;
    }

    .btn-toggle:hover:not(.active) {
      border-color: var(--primary-color, #007bff);
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary-color, #007bff);
    }

    .sessions-list, .devices-list, .blocked-users-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .session-item, .device-item, .blocked-user-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: var(--bg-primary, #ffffff);
      border: 1px solid var(--border-color, #e1e1e1);
      border-radius: 8px;
    }

    .session-info, .device-info, .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .session-location, .device-type, .blocked-date, .session-time, .device-time {
      font-size: 0.875rem;
      color: var(--text-secondary, #666666);
    }

    .current-session, .trusted-device {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--success-color, #28a745);
      color: white;
    }

    .security-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
    }

    .security-item p {
      margin: 5px 0 0 0;
      color: var(--text-secondary, #666666);
      font-size: 0.875rem;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--bg-disabled, #ccc);
      transition: .4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--primary-color, #007bff);
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .alert-item {
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .alert-info {
      background: rgba(0, 123, 255, 0.1);
      border-left-color: var(--primary-color, #007bff);
    }

    .alert-warning {
      background: rgba(255, 193, 7, 0.1);
      border-left-color: var(--warning-color, #ffc107);
    }

    .alert-error {
      background: rgba(220, 53, 69, 0.1);
      border-left-color: var(--error-color, #dc3545);
    }

    .alert-time {
      font-size: 0.75rem;
      color: var(--text-secondary, #666666);
      display: block;
      margin-top: 5px;
    }

    .add-block-user {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .add-block-user .form-control {
      flex: 1;
    }

    .danger-zone {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid var(--error-color, #dc3545);
    }

    .danger-zone h3 {
      color: var(--error-color, #dc3545);
      margin-bottom: 15px;
    }

    .confirmation-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--bg-primary, #ffffff);
      padding: 30px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-content h4 {
      margin: 0 0 15px 0;
      color: var(--error-color, #dc3545);
    }

    .modal-content p {
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .settings-container {
        padding: 15px;
      }

      .settings-card {
        padding: 20px;
      }

      .session-item, .device-item, .blocked-user-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .add-block-user {
        flex-direction: column;
      }

      .toggle-group {
        flex-direction: column;
      }

      .modal-content {
        padding: 20px;
      }

      .modal-actions {
        flex-direction: column;
      }
    }

  `]
})
export class UserSettingsComponent implements OnInit {
  passwordForm: FormGroup;
  
  editingName = false;
  showDeleteConfirm = false;
  newBlockUser = '';
  currentLanguage = 'en';
  currentTheme = 'light';

  userProfile: UserProfile = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'online'
  };

  preferences = {
    emailNotifications: true,
    pushNotifications: false,
    timeFormat: '24h'
  };

  security = {
    twoFactorEnabled: false
  };

  privacy = {
    profileVisibility: 'public',
    dataSharing: true
  };

  activeSessions: ActiveSession[] = [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, USA',
      lastActive: new Date(),
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, USA',
      lastActive: new Date(Date.now() - 3600000),
      current: false
    }
  ];

  recognizedDevices: RecognizedDevice[] = [
    {
      id: '1',
      name: 'John\'s MacBook Pro',
      type: 'Laptop',
      lastSeen: new Date(),
      trusted: true
    },
    {
      id: '2',
      name: 'iPhone 15',
      type: 'Mobile',
      lastSeen: new Date(Date.now() - 86400000),
      trusted: true
    }
  ];

  securityAlerts = [
    {
      id: '1',
      type: 'info',
      title: 'New device login',
      message: 'Someone signed in from a new device in New York',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      id: '2',
      type: 'warning',
      title: 'Password change attempt',
      message: 'Failed password change attempt detected',
      timestamp: new Date(Date.now() - 172800000)
    }
  ];

  blockedUsers: BlockedUser[] = [
    {
      id: '1',
      username: 'spammer123',
      blockedDate: new Date(Date.now() - 604800000)
    }
  ];

  constructor(private fb: FormBuilder) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Initialize component
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  triggerImageUpload() {
    const imageUpload = document.querySelector('input[type="file"]') as HTMLInputElement;
    imageUpload.click();
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.userProfile.profileImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEditName() {
    this.editingName = !this.editingName;
  }

  changePassword() {
    if (this.passwordForm.valid) {
      // Simulate password change
      console.log('Password changed successfully');
      this.passwordForm.reset();
    }
  }

  toggleThemeOld(theme: 'light' | 'dark') {
    this.currentTheme = theme;
    // Intégration avec le système de thème global de l'application
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  logoutSession(sessionId: string) {
    this.activeSessions = this.activeSessions.filter(session => session.id !== sessionId);
  }

  deleteAccount() {
    // Simulate account deletion
    console.log('Account deleted');
    this.showDeleteConfirm = false;
  }

  toggleDeviceTrust(deviceId: string) {
    const device = this.recognizedDevices.find(d => d.id === deviceId);
    if (device) {
      device.trusted = !device.trusted;
    }
  }

  blockUser() {
    if (this.newBlockUser.trim()) {
      this.blockedUsers.push({
        id: Date.now().toString(),
        username: this.newBlockUser.trim(),
        blockedDate: new Date()
      });
      this.newBlockUser = '';
    }
  }

  unblockUser(userId: string) {
    this.blockedUsers = this.blockedUsers.filter(user => user.id !== userId);
  }
}
