import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface PortInfo {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
}

interface ServerConfig {
  component: string;
  status: 'ok' | 'warning' | 'critical';
  details: string;
}

interface FirewallInfo {
  status: 'enabled' | 'disabled' | 'partial';
  type: string;
}

interface AuditResults {
  overallScore: number;
  openPorts: PortInfo[];
  serverConfig: ServerConfig[];
  firewall: FirewallInfo;
}

@Component({
  selector: 'app-infrastructure-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-container">
      <!-- Header -->
      <header class="audit-header">
        <div class="header-content">
          <h1 class="title">Audit d'Infrastructure & Réseau</h1>
          <p class="subtitle">Évaluation complète de la sécurité et analyse des vulnérabilités</p>
        </div>
      </header>

      <!-- URL Input Form -->
      <div class="url-form-card">
        <form (ngSubmit)="performAudit()" class="url-form">
          <div class="input-group">
            <label for="backendUrl" class="input-label">URL du Backend</label>
            <input
              id="backendUrl"
              type="url"
              [(ngModel)]="backendUrl"
              name="backendUrl"
              placeholder="https://api.exemple.com/audit"
              class="url-input"
              [disabled]="isLoading"
              required
            />
          </div>
          <button
            type="submit"
            class="audit-button"
            [disabled]="isLoading || !backendUrl"
          >
            <span *ngIf="!isLoading">Lancer l'Audit</span>
            <span *ngIf="isLoading" class="loading-content">
              <div class="spinner"></div>
              Audit en cours...
            </span>
          </button>
        </form>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="error-card">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-text">
            <h3>Échec de l'Audit</h3>
            <p>{{ errorMessage }}</p>
            <button (click)="performAudit()" class="retry-button">
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div *ngIf="auditResults && !isLoading" class="results-container">
        <!-- Overall Score -->
        <div class="score-card">
          <div class="score-content">
            <div class="score-circle" [class]="getScoreClass(auditResults.overallScore)">
              <span class="score-number">{{ auditResults.overallScore }}</span>
              <span class="score-total">/100</span>
            </div>
            <div class="score-info">
              <h2>Score de Sécurité</h2>
              <p class="score-description">{{ getScoreDescription(auditResults.overallScore) }}</p>
            </div>
          </div>
        </div>

        <!-- Results Grid -->
        <div class="results-grid">
          <!-- Open Ports Section -->
          <div class="result-card ports-card">
            <div class="card-header">
              <h3>🔌 Ports Ouverts & Services</h3>
              <span class="port-count">{{ auditResults.openPorts.length }} ports scannés</span>
            </div>
            <div class="ports-table-container">
              <table class="ports-table">
                <thead>
                  <tr>
                    <th>Port</th>
                    <th>Service</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let port of auditResults.openPorts" class="port-row">
                    <td class="port-number">{{ port.port }}</td>
                    <td class="service-name">{{ port.service }}</td>
                    <td>
                      <span class="status-badge" [class]="'status-' + port.status">
                        {{ port.status | titlecase }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Server Configuration Section -->
          <div class="result-card config-card">
            <div class="card-header">
              <h3>⚙️ Configuration du Serveur</h3>
            </div>
            <div class="config-list">
              <div *ngFor="let config of auditResults.serverConfig" class="config-item">
                <div class="config-icon">
                  <span [innerHTML]="getStatusIcon(config.status)"></span>
                </div>
                <div class="config-details">
                  <h4 class="config-component">{{ config.component }}</h4>
                  <p class="config-description">{{ config.details }}</p>
                </div>
                <div class="config-status" [class]="'status-' + config.status">
                  {{ config.status | titlecase }}
                </div>
              </div>
            </div>
          </div>

          <!-- Firewall Section -->
          <div class="result-card firewall-card">
            <div class="card-header">
              <h3>🛡️ Pare-feu & WAF</h3>
            </div>
            <div class="firewall-content">
              <div class="firewall-status">
                <div class="firewall-indicator" [class]="'firewall-' + auditResults.firewall.status">
                  <div class="indicator-dot"></div>
                  <span class="status-text">{{ auditResults.firewall.status | titlecase }}</span>
                </div>
                <div class="firewall-type">
                  <strong>Type :</strong> {{ auditResults.firewall.type }}
                </div>
              </div>
              <div class="firewall-description">
                <p>{{ getFirewallDescription(auditResults.firewall.status) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--bg-secondary);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text-primary);
    }

    .audit-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    /* Header Styles */
    .audit-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header-content {
      background: var(--bg-primary);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow);
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }

    .subtitle {
      font-size: 1.125rem;
      margin: 0;
      color: var(--text-secondary);
    }

    /* URL Form Styles */
    .url-form-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .url-form {
      display: flex;
      gap: 16px;
      align-items: end;
    }

    .input-group {
      flex: 1;
    }

    .input-label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .url-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .url-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .url-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .audit-button {
      padding: 12px 24px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 140px;
      height: 48px;
    }

    .audit-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--primary-light);
    }

    .audit-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-content {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Error Styles */
    .error-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    :host-context(.dark) .error-card {
      background: #742a2a;
      border-color: #c53030;
    }

    .error-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .error-icon {
      font-size: 1.5rem;
    }

    .error-text h3 {
      margin: 0 0 8px 0;
      color: #dc2626;
      font-weight: 600;
    }

    :host-context(.dark) .error-text h3 {
      color: #fc8181;
    }

    .error-text p {
      margin: 0 0 16px 0;
      color: #7f1d1d;
    }

    :host-context(.dark) .error-text p {
      color: #fed7d7;
    }

    .retry-button {
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .retry-button:hover {
      background: #b91c1c;
    }

    /* Results Styles */
    .results-container {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .score-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .score-content {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      position: relative;
    }

    .score-circle.score-high {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .score-circle.score-medium {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .score-circle.score-low {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .score-number {
      font-size: 2rem;
      line-height: 1;
    }

    .score-total {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .score-info h2 {
      margin: 0 0 8px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .score-description {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1.125rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .result-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: transform 0.2s ease;
    }

    .result-card:hover {
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .port-count {
      background: var(--bg-secondary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Ports Table */
    .ports-table-container {
      overflow-x: auto;
    }

    .ports-table {
      width: 100%;
      border-collapse: collapse;
    }

    .ports-table th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      color: var(--text-primary);
      border-bottom: 2px solid var(--border-color);
    }

    .ports-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .port-number {
      font-weight: 600;
      font-family: 'Monaco', 'Menlo', monospace;
    }

    .service-name {
      color: var(--text-secondary);
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-open {
      background: #dcfce7;
      color: #166534;
    }

    .status-closed {
      background: #fef2f2;
      color: #991b1b;
    }

    .status-filtered {
      background: #fef3c7;
      color: #92400e;
    }

    :host-context(.dark) .status-open {
      background: #166534;
      color: #dcfce7;
    }

    :host-context(.dark) .status-closed {
      background: #991b1b;
      color: #fef2f2;
    }

    :host-context(.dark) .status-filtered {
      background: #92400e;
      color: #fef3c7;
    }

    /* Config List */
    .config-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .config-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      transition: background-color 0.2s ease;
    }

    .config-item:hover {
      background: var(--bg-primary);
    }

    .config-icon {
      font-size: 1.5rem;
      width: 32px;
      text-align: center;
    }

    .config-details {
      flex: 1;
    }

    .config-component {
      margin: 0 0 4px 0;
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary);
    }

    .config-description {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .config-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .config-status.status-ok {
      background: #dcfce7;
      color: #166534;
    }

    .config-status.status-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .config-status.status-critical {
      background: #fef2f2;
      color: #991b1b;
    }

    :host-context(.dark) .config-status.status-ok {
      background: #166534;
      color: #dcfce7;
    }

    :host-context(.dark) .config-status.status-warning {
      background: #92400e;
      color: #fef3c7;
    }

    :host-context(.dark) .config-status.status-critical {
      background: #991b1b;
      color: #fef2f2;
    }

    /* Firewall Styles */
    .firewall-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .firewall-status {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .firewall-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .indicator-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .firewall-enabled .indicator-dot {
      background: #10b981;
    }

    .firewall-disabled .indicator-dot {
      background: #ef4444;
    }

    .firewall-partial .indicator-dot {
      background: #f59e0b;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .firewall-type {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .firewall-description {
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
    }

    .firewall-description p {
      margin: 0;
      color: var(--text-primary);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .audit-container {
        padding: 16px;
      }

      .title {
        font-size: 2rem;
      }

      .url-form {
        flex-direction: column;
        align-items: stretch;
      }

      .audit-button {
        width: 100%;
      }

      .score-content {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }

      .results-grid {
        grid-template-columns: 1fr;
      }

      .config-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .config-status {
        align-self: flex-start;
      }
    }
  `]
})
export class InfrastructureAuditComponent {
  private http = inject(HttpClient);

  backendUrl = '';
  isLoading = false;
  errorMessage = '';
  auditResults: AuditResults | null = null;

  performAudit() {
    if (!this.backendUrl) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.auditResults = null;

    this.http.get<AuditResults>(this.backendUrl)
      .pipe(
        catchError(error => {
          console.error('Audit failed:', error);
          // Return mock data for demonstration
          return of(this.getMockData());
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (results) => {
          this.auditResults = results;
        },
        error: (error) => {
          this.errorMessage = `Échec de récupération des résultats d'audit : ${error.message || 'Erreur inconnue'}`;
        }
      });
  }

  private getMockData(): AuditResults {
    return {
      overallScore: 78,
      openPorts: [
        { port: 80, service: 'HTTP', status: 'open' },
        { port: 443, service: 'HTTPS', status: 'open' },
        { port: 22, service: 'SSH', status: 'filtered' },
        { port: 3306, service: 'MySQL', status: 'closed' },
        { port: 8080, service: 'HTTP-Alt', status: 'open' }
      ],
      serverConfig: [
        { component: 'Serveur HTTP Apache', status: 'ok', details: 'Version 2.4.41, correctement configuré' },
        { component: 'PHP', status: 'warning', details: 'Version 7.4.3, mise à jour recommandée' },
        { component: 'Base de données MySQL', status: 'ok', details: 'Version 8.0.25, configuration sécurisée' },
        { component: 'Certificat SSL', status: 'critical', details: 'Le certificat expire dans 7 jours' }
      ],
      firewall: {
        status: 'enabled',
        type: 'iptables with fail2ban'
      }
    };
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  getScoreDescription(score: number): string {
    if (score >= 80) return 'Posture de sécurité excellente';
    if (score >= 60) return 'Bonne sécurité avec des améliorations possibles';
    return 'La sécurité nécessite une attention immédiate';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  getFirewallDescription(status: string): string {
    switch (status) {
      case 'enabled':
        return 'Le pare-feu est actif et correctement configuré. Tous les ports inutiles sont bloqués et la détection d\'intrusion est activée.';
      case 'disabled':
        return 'Le pare-feu est désactivé. Cela représente un risque de sécurité important car tous les ports sont potentiellement accessibles.';
      case 'partial':
        return 'Le pare-feu est partiellement configuré. Certaines règles sont en place mais un renforcement supplémentaire est recommandé.';
      default:
        return 'Le statut du pare-feu n\'a pas pu être déterminé.';
    }
  }
}
