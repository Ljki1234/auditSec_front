import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { NmapService } from '../../core/services/nmap.service';
import { NmapResultProcessor, ProcessedNmapResult } from '../../models/nmap.interface';
import { ConfigurationService, ConfigurationResult } from '../../core/services/configuration.service';
import { FirewallService, FirewallDetectionResult } from '../../core/services/firewall.service';

interface PortInfo {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
}

interface ServerConfig {
  component: string;
  version: string;
  status: 'Ok' | 'Warning' | 'Critical';
  message: string;
}

interface FirewallInfo {
  status: 'Enabled' | 'Disabled' | 'Partial' | 'enabled' | 'disabled' | 'partial';
  type: string;
  message: string;
  detectedHeaders?: {
    [key: string]: string;
  };
  normalStatus?: number;
  attackStatus?: number;
}

interface AuditResults {
  overallScore: number;
  openPorts: PortInfo[];
  serverConfig: ServerConfig[];
  firewall: FirewallInfo;
  scanInfo?: {
    target: string;
    scanTime: string;
    totalPorts: number;
    openPortsCount: number;
    filteredPortsCount: number;
    closedPortsCount: number;
  };
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

        <!-- Results Grid -->
        <div class="results-grid">
          <!-- Open Ports Section -->
          <div class="result-card ports-card">
            <div class="card-header">
              <div class="card-title">
                <div class="card-icon" [style.color]="getCardColor('ports')">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="ports-icon" [attr.fill]="getCardColor('ports')">
                    <path d="M192 32C209.7 32 224 46.3 224 64L224 160L352 160L352 64C352 46.3 366.3 32 384 32C401.7 32 416 46.3 416 64L416 160L480 160C497.7 160 512 174.3 512 192C512 209.7 497.7 224 480 224L480 272.7C381.4 280.8 304 363.4 304 464C304 491.3 309.7 517.3 320 540.9L320 544C320 561.7 305.7 576 288 576C270.3 576 256 561.7 256 544L256 477.3C165.2 462.1 96 383.1 96 288L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160L160 64C160 46.3 174.3 32 192 32zM352 464C352 384.5 416.5 320 496 320C575.5 320 640 384.5 640 464C640 543.5 575.5 608 496 608C416.5 608 352 543.5 352 464zM529.4 387C523.6 382.8 515.6 383 510 387.5L430 451.5C424.7 455.7 422.6 462.9 424.9 469.3C427.2 475.7 433.2 480 440 480L472.9 480L457 522.4C454.5 529.1 456.8 536.7 462.6 541C468.4 545.3 476.4 545 482 540.5L562 476.5C567.3 472.3 569.4 465.1 567.1 458.7C564.8 452.3 558.8 448 552 448L519.1 448L535 405.6C537.5 398.9 535.2 391.3 529.4 387z"/>
                  </svg>
                </div>
                <h3>Ports Ouverts & Services</h3>
              </div>
              <div class="port-stats">
                <span class="port-count">{{ auditResults.openPorts.length }} ports scannés</span>
                <span *ngIf="auditResults.scanInfo" class="scan-info">
                  Cible: {{ auditResults.scanInfo.target }}
                </span>
              </div>
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
              <div class="card-title">
                <div class="card-icon" [style.color]="getCardColor('config')">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="config-icon" [attr.fill]="getCardColor('config')">
                    <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
                  </svg>
                </div>
                <h3>Configuration du Serveur</h3>
              </div>
            </div>
            <div class="config-list">
              <div *ngFor="let config of auditResults.serverConfig" class="config-item">
                <div class="config-icon">
                  <span [innerHTML]="getStatusIcon(config.status)"></span>
                </div>
                <div class="config-details">
                  <h4 class="config-component">{{ config.component }}</h4>
                  <p class="config-version">Version: {{ config.version }}</p>
                  <p class="config-description">{{ config.message }}</p>
                </div>
                <div class="config-status" [class]="'status-' + config.status.toLowerCase()">
                  {{ config.status }}
                </div>
              </div>
            </div>
          </div>

          <!-- Firewall Section -->
          <div class="result-card firewall-card">
            <div class="card-header">
              <div class="card-title">
                <div class="card-icon" [style.color]="getCardColor('firewall')">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="firewall-icon" [attr.fill]="getCardColor('firewall')">
                    <path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/>
                  </svg>
                </div>
                <h3>Pare-feu & WAF</h3>
              </div>
            </div>
            <div class="firewall-content">
              <div class="firewall-simple">
                <div class="firewall-line">
                  <strong>Status:</strong> {{ auditResults.firewall.status }}
                </div>
                <div class="firewall-line">
                  <strong>Type:</strong> {{ auditResults.firewall.type }}
                </div>
                <div class="firewall-line">
                  <strong>Message:</strong> {{ auditResults.firewall.message }}
                </div>
                <div *ngIf="auditResults.firewall.detectedHeaders" class="firewall-line">
                  <strong>Headers détectés:</strong> {{ getHeadersString(auditResults.firewall.detectedHeaders) }}
                </div>
                <div *ngIf="auditResults.firewall.normalStatus !== undefined && auditResults.firewall.attackStatus !== undefined" class="firewall-line">
                  <strong>Codes de réponse:</strong> normal: {{ auditResults.firewall.normalStatus }} | attaque: {{ auditResults.firewall.attackStatus }}
                </div>
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

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      background: var(--primary-light);
      color: var(--text-primary);
      flex-shrink: 0;
    }

    /* Mode sombre : icônes grises */
    [data-theme="dark"] .card-icon {
      color: #111827 !important;
    }

    [data-theme="dark"] .card-icon svg {
      fill: #111827 !important;
    }

    [data-theme="dark"] .card-icon svg path {
      fill: #111827 !important;
    }
    
    .card-icon svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .ports-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .config-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .firewall-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    /* Mode sombre : toutes les icônes SVG spécifiques */
    [data-theme="dark"] .ports-icon,
    [data-theme="dark"] .config-icon,
    [data-theme="dark"] .firewall-icon {
      fill: #111827 !important;
    }

    [data-theme="dark"] .ports-icon path,
    [data-theme="dark"] .config-icon path,
    [data-theme="dark"] .firewall-icon path {
      fill: #111827 !important;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .port-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .port-count {
      background: var(--bg-secondary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .scan-info {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Ports Table */
    .ports-table-container {
      overflow-x: auto;
    }

    .ports-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .ports-table th {
      text-align: left;
      padding: 16px 20px;
      font-weight: 600;
      color: var(--text-primary);
      border-bottom: 2px solid var(--border-color);
      font-size: 0.95rem;
    }

    .ports-table td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .ports-table th:nth-child(1),
    .ports-table td:nth-child(1) {
      width: 20%;
    }

    .ports-table th:nth-child(2),
    .ports-table td:nth-child(2) {
      width: 50%;
    }

    .ports-table th:nth-child(3),
    .ports-table td:nth-child(3) {
      width: 30%;
    }

    .port-number {
      font-weight: 600;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 1rem;
    }

    .service-name {
      color: var(--text-secondary);
      font-size: 1rem;
      font-weight: 500;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 16px;
      font-size: 0.9rem;
      font-weight: 600;
      display: inline-block;
      min-width: 80px;
      text-align: center;
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

    .config-version {
      margin: 0 0 4px 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
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

    .firewall-simple {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .firewall-line {
      font-size: 0.875rem;
      line-height: 1.4;
      color: var(--text-primary);
    }

    .firewall-line strong {
      color: var(--text-primary);
      font-weight: 600;
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

      .ports-table th,
      .ports-table td {
        padding: 12px 16px;
        font-size: 0.9rem;
      }

      .ports-table th:nth-child(1),
      .ports-table td:nth-child(1) {
        width: 25%;
      }

      .ports-table th:nth-child(2),
      .ports-table td:nth-child(2) {
        width: 45%;
      }

      .ports-table th:nth-child(3),
      .ports-table td:nth-child(3) {
        width: 30%;
      }

      .status-badge {
        padding: 6px 12px;
        font-size: 0.8rem;
        min-width: 70px;
      }
    }
  `]
})
export class InfrastructureAuditComponent {
  private http = inject(HttpClient);
  private nmapService = inject(NmapService);
  private configurationService = inject(ConfigurationService);
  private firewallService = inject(FirewallService);

  backendUrl = '';
  isLoading = false;
  errorMessage = '';
  auditResults: AuditResults | null = null;

  constructor() {
    // Observer les changements de thème pour mettre à jour les couleurs des icônes
    const observer = new MutationObserver(() => {
      // Forcer la détection de changement dans Angular
      this.onThemeChange();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  performAudit() {
    if (!this.backendUrl) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.auditResults = null;

    // Appeler les trois APIs en parallèle : nmap, configuration et pare-feu
    const nmapScan$ = this.nmapService.scanUrlWithDefaultPorts(this.backendUrl)
      .pipe(
        catchError(error => {
          console.error('Nmap scan failed:', error);
          return of(null);
        })
      );

    const configurationCheck$ = this.configurationService.checkConfiguration(this.backendUrl)
      .pipe(
        catchError(error => {
          console.error('Configuration check failed:', error);
          return of([]);
        })
      );

    const firewallAnalysis$ = this.firewallService.analyzeFirewall(this.backendUrl)
      .pipe(
        catchError(error => {
          console.error('Firewall analysis failed:', error);
          return of(null);
        })
      );

    // Exécuter les trois appels en parallèle
    forkJoin({
      nmap: nmapScan$,
      configuration: configurationCheck$,
      firewall: firewallAnalysis$
    })
    .pipe(
      finalize(() => {
        this.isLoading = false;
      })
    )
    .subscribe({
      next: (results) => {
        let processedNmapResult: ProcessedNmapResult | null = null;
        
        // Traiter les résultats nmap
        if (results.nmap && typeof results.nmap === 'object' && '@version' in results.nmap) {
          processedNmapResult = NmapResultProcessor.processNmapResult(results.nmap);
        }

        // Créer les résultats d'audit en combinant nmap, configuration et pare-feu
        this.auditResults = this.createAuditResults(processedNmapResult, results.configuration, results.firewall);
      },
      error: (error) => {
        console.error('Error processing audit results:', error);
        this.errorMessage = `Erreur lors du traitement des résultats : ${error.message || 'Erreur inconnue'}`;
        // Utiliser les données mock en cas d'erreur
        this.auditResults = this.getMockData();
      }
    });
  }

  /**
   * Crée les résultats d'audit en combinant les résultats nmap, de configuration et de pare-feu
   */
  private createAuditResults(processedNmapResult: ProcessedNmapResult | null, configurationResults: ConfigurationResult[], firewallResult: FirewallDetectionResult | null): AuditResults {
    // Utiliser les résultats nmap s'ils sont disponibles, sinon utiliser des données par défaut
    const nmapData = processedNmapResult || this.getDefaultNmapData();
    
    // Convertir les résultats de configuration en format ServerConfig
    const serverConfig: ServerConfig[] = configurationResults.map(config => ({
      component: config.component,
      version: config.version,
      status: config.status,
      message: config.message
    }));

    // Convertir les résultats de pare-feu en format FirewallInfo
    let firewallInfo: FirewallInfo;
    if (firewallResult) {
      firewallInfo = {
        status: firewallResult.status,
        type: firewallResult.type,
        message: firewallResult.message,
        detectedHeaders: firewallResult.detectedHeaders,
        normalStatus: firewallResult.normalStatus,
        attackStatus: firewallResult.attackStatus
      };
    } else {
      // Utiliser les données par défaut si l'API de pare-feu échoue
      firewallInfo = {
        status: 'enabled',
        type: 'Unknown',
        message: 'Statut du pare-feu non déterminé'
      };
    }

    return {
      overallScore: nmapData.overallScore,
      openPorts: nmapData.openPorts.map(port => ({
        port: port.port,
        service: port.service,
        status: port.status
      })),
      serverConfig: serverConfig,
      firewall: firewallInfo,
      scanInfo: nmapData.scanInfo
    };
  }

  /**
   * Convertit les résultats traités nmap en format AuditResults
   */
  private convertToAuditResults(processedResult: ProcessedNmapResult): AuditResults {
    return {
      overallScore: processedResult.overallScore,
      openPorts: processedResult.openPorts.map(port => ({
        port: port.port,
        service: port.service,
        status: port.status
      })),
      serverConfig: [], // Les données de configuration viennent maintenant de l'API séparée
      firewall: {
        status: 'enabled',
        type: 'Unknown',
        message: 'Statut du pare-feu non déterminé'
      },
      scanInfo: processedResult.scanInfo
    };
  }

  /**
   * Retourne des données nmap par défaut en cas d'erreur
   */
  private getDefaultNmapData(): ProcessedNmapResult {
    return {
      overallScore: 75,
      openPorts: [
        { port: 80, service: 'HTTP', status: 'open', protocol: 'tcp' },
        { port: 443, service: 'HTTPS', status: 'open', protocol: 'tcp' }
      ],
      serverConfig: [],
      firewall: {
        status: 'enabled',
        type: 'Unknown',
        message: 'Statut du pare-feu non déterminé'
      },
      scanInfo: {
        target: this.backendUrl,
        scanTime: new Date().toISOString(),
        totalPorts: 1000,
        openPortsCount: 2,
        filteredPortsCount: 0,
        closedPortsCount: 998
      }
    };
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
        { component: 'Serveur HTTP', version: 'Apache 2.4.41', status: 'Ok', message: 'Serveur correctement configuré' },
        { component: 'PHP', version: '7.4.3', status: 'Warning', message: 'Mise à jour recommandée' },
        { component: 'Base de données MySQL', version: '8.0.25', status: 'Ok', message: 'Configuration sécurisée' },
        { component: 'Certificat SSL', version: 'Expire dans 7 jours', status: 'Critical', message: 'Le certificat expire bientôt' }
      ],
      firewall: {
        status: 'enabled',
        type: 'iptables with fail2ban',
        message: 'Le pare-feu est actif et correctement configuré'
      }
    };
  }


  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  getCardColor(type: string): string {
    // Détecter le mode sombre
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
      return '#111827';
    } else {
      return 'currentColor';
    }
  }

  // Méthode pour forcer la mise à jour des couleurs lors du changement de thème
  onThemeChange() {
    // Cette méthode sera appelée quand le thème change
    // Elle force la détection de changement dans Angular
    return this.getCardColor('');
  }

  getFirewallDescription(status: string): string {
    switch (status.toLowerCase()) {
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

  getDetectedHeaders(headers: { [key: string]: string }): { key: string; value: string }[] {
    return Object.entries(headers).map(([key, value]) => ({ key, value }));
  }

  getHeadersString(headers: { [key: string]: string }): string {
    // Filtrer les headers pour exclure les cookies et autres headers trop longs
    const filteredHeaders = Object.entries(headers)
      .filter(([key, value]) => {
        const lowerKey = key.toLowerCase();
        // Exclure les cookies et autres headers trop longs ou non pertinents
        return !lowerKey.includes('cookie') && 
               !lowerKey.includes('set-cookie') && 
               !lowerKey.includes('authorization') &&
               !lowerKey.includes('x-forwarded') &&
               value.length < 100; // Exclure les valeurs trop longues
      })
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return filteredHeaders || 'Aucun header pertinent détecté';
  }
}
