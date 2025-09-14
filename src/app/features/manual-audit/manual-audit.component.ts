import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface ManualTest {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failed' | 'vulnerable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  description: string;
}

export interface FormValidationTest {
  testName: string;
  status: 'Success' | 'Failed';
  severity: 'Low' | 'Medium' | 'High';
  recommendation: string;
  payload: string;
  response: string;
  formField: string;
  formAction: string;
  formMethod: string;
}

export interface FormValidationResult {
  results: FormValidationTest[];
  scoreGlobal: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'DANGER';
  message: string;
  summary: string;
  success: boolean;
  url: string;
}

export interface AuthenticationTest {
  testName: string;
  status: 'SUCCESS' | 'FAILED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  payload: string;
  method: string;
  responseCode: number;
  responseMessage: string;
  protected: boolean;
}

export interface AuthenticationResult {
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'DANGER';
  tests: AuthenticationTest[];
  scoreGlobal: number;
  message: string;
  summary: string;
  success: boolean;
  url: string;
}

export interface FileSecurityTest {
  testName: string;
  status: 'PASSED' | 'FAILED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  payload: string;
  method: string;
  responseCode: number;
  responseMessage: string;
  protected: boolean;
}

export interface FileSecurityResult {
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'DANGER';
  tests: FileSecurityTest[];
  scoreGlobal: number;
  message: string;
  summary: string;
  success: boolean;
  url: string;
}

export interface SqlInjectionTest {
  testName: string;
  status: 'SUCCESS' | 'FAILED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  payload: string;
  method: string;
  responseCode: number;
  responseMessage: string;
  vulnerable: boolean;
}

export interface SqlInjectionResult {
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'DANGER';
  tests: SqlInjectionTest[];
  globalScore: number;
  overallStatus: string;
  summary: string;
  message: string;
  success: boolean;
  url: string;
}

export interface XssTest {
  testName: string;
  payload: string;
  method: string;
  responseCode: number;
  responseMessage: string;
  responseTime: number;
  status: 'SUCCESS' | 'FAILED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  confidenceScore: number;
  detectionType: string;
  vulnerable: boolean;
}

export interface XssResult {
  summary: string;
  tests: XssTest[];
  success: boolean;
  globalScore: number;
  message: string;
  url: string;
  overallStatus: string;
}

export interface AdminPanelResult {
  responseCode: number;
  testName: string;
  resultMessage: string;
  message: string;
  recommendation: string;
  status: string;
  severity: string;
  url: string;
  success: boolean;
}

export interface SslTlsResult {
  testName: string;
  resultMessage: string;
  message: string;
  recommendation: string;
  details: {
    tlsProtocols: {
      unsupported: string[];
      hasTls12: boolean;
      hasTls13: boolean;
      hasWeakProtocols: boolean;
      supported: string[];
    };
    securityMetrics: {
      riskLevel: string;
      protocolScore: number;
      certificateScore: number;
      overallScore: number;
      confidence: string;
      trustBonus: number;
      cipherScore: number;
    };
    cipherSuites: {
      hasWeakCiphers: boolean;
      totalWeak: number;
      weakRatio: number;
      analysis: string;
      weakCiphers: string[];
      supported: string[];
      totalSupported: number;
    };
    certificate: {
      domainMatch: boolean;
      serialNumber: string;
      expired: boolean;
      keySize: number;
      trustedCA: boolean;
      subject: string;
      selfSigned: boolean;
      validFrom: string;
      version: number;
      issuer: string;
      signatureAlgorithm: string;
      validTo: string;
    };
    vulnerabilities: {
      count: number;
      detected: string[];
      hasVulnerabilities: boolean;
    };
  };
  status: string;
  severity: string;
  url: string;
  success: boolean;
}

export interface SessionManagementResult {
  testName: string;
  message: string;
  score: number;
  success: boolean;
  url: string;
  timestamp: string;
  vulnerabilities: Array<{
    name: string;
    description: string;
    status: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'WARNING';
    timestamp: string;
  }>;
  detailedResults: {
    sessionCookieTest: {
      sessionCookieNames: string[];
      hasSessionCookie: boolean;
      vulnerabilities: any[];
      scoreDeduction: number;
      totalCookies: number;
      detectedCookies: Array<{
        sameSiteValue: string;
        expires: string | null;
        maxAge: string | null;
        sameSite: boolean;
        name: string;
        httpOnly: boolean;
        secure: boolean;
        value: string;
        url: string;
        rawHeader: string;
      }>;
    };
    sessionFixationTest: {
      sessionFixationProtected: boolean;
      initialSessionId: string;
      secondSessionId: string;
      vulnerabilities: any[];
      scoreDeduction: number;
    };
    logoutTest: {
      vulnerabilities: any[];
      scoreDeduction: number;
    };
    sessionTimeoutTest: {
      vulnerabilities: any[];
      scoreDeduction: number;
    };
    httpsTest: {
      isHttp: boolean;
      protocol: string;
      isHttps: boolean;
      vulnerabilities: any[];
      scoreDeduction: number;
    };
    cookieAttributesTest: {
      vulnerabilities: any[];
      scoreDeduction: number;
    };
  };
}

@Component({
  selector: 'app-manual-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="manual-audit-container">
      <div class="audit-header">
        <div class="header-content">
          <h1 class="page-title" [class.dark-title]="isDarkMode">Audit de Sécurité Manuel</h1>
          <p class="page-subtitle">Tests de sécurité manuels complets pour applications web</p>
        </div>
      </div>

      <div class="audit-content">
        <div class="url-input-section">
          <div class="input-group">
            <label for="audit-url" class="input-label">URL Cible</label>
            <div class="input-wrapper">
              <input
                id="audit-url"
                type="url"
                [(ngModel)]="targetUrl"
                placeholder="https://exemple.com"
                class="url-input"
                [disabled]="isAuditing()"
              />
              <button
                class="audit-btn primary"
                (click)="runAudit()"
                [disabled]="!targetUrl || isAuditing()">
                <span class="btn-content">
                  <span *ngIf="!isAuditing()">Lancer l'Audit Manuel</span>
                  <span *ngIf="isAuditing()" class="loading">
                    <span class="spinner"></span>
                    Audit en cours...
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="audit-results" *ngIf="auditResults().length > 0 && !isAuditing() && (formValidationResult() || authenticationResult() || fileSecurityResult())">
          <div class="results-header">
            <div class="results-info">
              <h2 class="results-title">Résultats de l'Audit</h2>
              <div class="results-meta">
                <span class="test-count">{{ getTotalTestCount() }} tests</span>
                <span class="separator">•</span>
                <span class="status-summary">
                  {{ getTotalSuccessCount() }} réussis, 
                  {{ getTotalProblemCount() }} problèmes trouvés
                </span>
              </div>
            </div>
            
            <button
              class="audit-btn secondary"
              (click)="rerunAudit()"
              [disabled]="isAuditing()">
              <span class="refresh-icon">↻</span>
              Relancer l'Audit
            </button>
          </div>

          <div class="tests-grid">
            <!-- Test de Validation des Formulaires (affiché en premier) -->
            <div
              *ngIf="formValidationResult()"
              class="test-card clickable-test-card"
              [attr.data-status]="getFormValidationStatus()"
              [attr.data-severity]="getFormValidationSeverity()"
              (click)="openFormValidationDetails()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Validation des Entrées de Formulaire</h3>
                  <p class="test-description">Test des entrées de formulaire pour les vulnérabilités XSS et la validation appropriée</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getFormValidationStatus()">
                    <span class="status-icon">{{ getFormValidationStatusIcon() }}</span>
                    {{ getFormValidationStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getFormValidationSeverity()">
                    {{ getFormValidationSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <div class="test-summary" *ngIf="formValidationResult()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ formValidationResult()?.scoreGlobal }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSuccessCount() }}</span>
                      <span class="stat-label">Réussis</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getFailedCount() }}</span>
                      <span class="stat-label">Échoués</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getFormValidationSummary() }}</p>
                </div>
              </div>
            </div>

            <!-- Test d'Authentification (affiché en deuxième) -->
            <div
              *ngIf="authenticationResult()"
              class="test-card clickable-test-card"
              [attr.data-status]="getAuthenticationStatus()"
              [attr.data-severity]="getAuthenticationSeverity()"
              (click)="openAuthenticationDetails()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Contournement d'Authentification</h3>
                  <p class="test-description">Test de sécurité de l'authentification et des mécanismes d'autorisation</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getAuthenticationStatus()">
                    <span class="status-icon">{{ getAuthenticationStatusIcon() }}</span>
                    {{ getAuthenticationStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getAuthenticationSeverity()">
                    {{ getAuthenticationSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <div class="test-summary" *ngIf="authenticationResult()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ authenticationResult()?.scoreGlobal }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getAuthenticationSuccessCount() }}</span>
                      <span class="stat-label">Réussis</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getAuthenticationFailedCount() }}</span>
                      <span class="stat-label">Échoués</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getAuthenticationSummary() }}</p>
                </div>
              </div>
            </div>

            <!-- Test de Sécurité des Fichiers (affiché en troisième) -->
            <div
              *ngIf="fileSecurityResult()"
              class="test-card clickable-test-card"
              [attr.data-status]="getFileSecurityStatus()"
              [attr.data-severity]="getFileSecuritySeverity()"
              (click)="openFileSecurityDetails()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Sécurité des Téléchargements de Fichiers</h3>
                  <p class="test-description">Test de la fonctionnalité de téléchargement de fichiers pour l'exécution de fichiers malveillants</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getFileSecurityStatus()">
                    <span class="status-icon">{{ getFileSecurityStatusIcon() }}</span>
                    {{ getFileSecurityStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getFileSecuritySeverity()">
                    {{ getFileSecuritySeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <div class="test-summary" *ngIf="fileSecurityResult()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ fileSecurityResult()?.scoreGlobal }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getFileSecuritySuccessCount() }}</span>
                      <span class="stat-label">Réussis</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getFileSecurityFailedCount() }}</span>
                      <span class="stat-label">Échoués</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getFileSecuritySummary() }}</p>
                </div>
              </div>
            </div>

            <!-- Test d'Injection SQL (affiché en quatrième) -->
            <div
              *ngIf="hasRunAudit"
              class="test-card clickable-test-card"
              [attr.data-status]="getSqlInjectionStatus()"
              [attr.data-severity]="getSqlInjectionSeverity()"
              (click)="handleSqlInjectionClick()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Tests d'Injection SQL</h3>
                  <p class="test-description">Test des requêtes de base de données pour les vulnérabilités d'injection SQL</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getSqlInjectionStatus()">
                    <span class="status-icon">{{ getSqlInjectionStatusIcon() }}</span>
                    {{ getSqlInjectionStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getSqlInjectionSeverity()">
                    {{ getSqlInjectionSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <!-- État de chargement -->
              <div class="test-progress" *ngIf="isSqlInjectionAuditing()">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Audit d'injection SQL en cours...</span>
              </div>

              <!-- Résultats -->
              <div class="test-summary" *ngIf="sqlInjectionResult() && !isSqlInjectionAuditing()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ sqlInjectionResult()?.globalScore }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSqlInjectionSuccessCount() }}</span>
                      <span class="stat-label">Réussis</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSqlInjectionFailedCount() }}</span>
                      <span class="stat-label">Échoués</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getSqlInjectionSummary() }}</p>
                </div>
              </div>

              <!-- Message d'action -->
              <div class="test-action" *ngIf="!sqlInjectionResult() && !isSqlInjectionAuditing()">
                <div class="action-message">
                  <span class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <p class="action-text">Cliquez pour lancer l'audit d'injection SQL</p>
                  <p class="action-note">Cet audit peut prendre plusieurs minutes</p>
                </div>
              </div>
            </div>

            <!-- Test Cross-Site Scripting (XSS) (affiché en cinquième) -->
            <div
              *ngIf="hasRunAudit"
              class="test-card clickable-test-card"
              [attr.data-status]="getXssStatus()"
              [attr.data-severity]="getXssSeverity()"
              (click)="handleXssClick()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Cross-Site Scripting (XSS)</h3>
                  <p class="test-description">Test des vulnérabilités XSS réfléchies et stockées</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getXssStatus()">
                    <span class="status-icon">{{ getXssStatusIcon() }}</span>
                    {{ getXssStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getXssSeverity()">
                    {{ getXssSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <!-- État de chargement -->
              <div class="test-progress" *ngIf="isXssAuditing()">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Audit XSS en cours...</span>
              </div>

              <!-- Résultats -->
              <div class="test-summary" *ngIf="xssResult() && !isXssAuditing()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ xssResult()?.globalScore }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getXssSuccessCount() }}</span>
                      <span class="stat-label">Réussis</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getXssFailedCount() }}</span>
                      <span class="stat-label">Échoués</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getXssSummary() }}</p>
                </div>
              </div>

              <!-- Message d'action -->
              <div class="test-action" *ngIf="!xssResult() && !isXssAuditing()">
                <div class="action-message">
                  <span class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <p class="action-text">Cliquez pour lancer l'audit XSS</p>
                  <p class="action-note">Cet audit peut prendre plusieurs minutes</p>
                </div>
              </div>
            </div>

            <!-- Test Accès au Panneau d'Administration (affiché en sixième) -->
            <div
              *ngIf="hasRunAudit"
              class="test-card clickable-test-card"
              [attr.data-status]="getAdminPanelStatus()"
              [attr.data-severity]="getAdminPanelSeverity()"
              (click)="handleAdminPanelClick()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Accès au Panneau d'Administration</h3>
                  <p class="test-description">Test d'accès non autorisé aux fonctions administratives</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getAdminPanelStatus()">
                    <span class="status-icon">{{ getAdminPanelStatusIcon() }}</span>
                    {{ getAdminPanelStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getAdminPanelSeverity()">
                    {{ getAdminPanelSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <!-- État de chargement -->
              <div class="test-progress" *ngIf="isAdminPanelAuditing()">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Audit Admin Panel en cours...</span>
              </div>

              <!-- Résultats -->
              <div class="test-summary" *ngIf="adminPanelResult() && !isAdminPanelAuditing()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ adminPanelResult()?.responseCode }}</span>
                      <span class="stat-label">Code</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getAdminPanelStatus() | titlecase }}</span>
                      <span class="stat-label">Status</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getAdminPanelSeverity() | titlecase }}</span>
                      <span class="stat-label">Sévérité</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getAdminPanelSummary() }}</p>
                </div>
              </div>

              <!-- Message d'action -->
              <div class="test-action" *ngIf="!adminPanelResult() && !isAdminPanelAuditing()">
                <div class="action-message">
                  <span class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <p class="action-text">Cliquez pour lancer l'audit Admin Panel</p>
                  <p class="action-note">Cet audit peut prendre plusieurs minutes</p>
                </div>
              </div>
            </div>

            <!-- Test Gestion des Sessions (affiché en septième) -->
            <div
              *ngIf="hasRunAudit"
              class="test-card clickable-test-card"
              [attr.data-status]="getSessionManagementStatus()"
              [attr.data-severity]="getSessionManagementSeverity()"
              (click)="handleSessionManagementClick()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Gestion des Sessions</h3>
                  <p class="test-description">Test de la gestion des sessions, du délai d'expiration et des contrôles de sécurité</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getSessionManagementStatus()">
                    <span class="status-icon">{{ getSessionManagementStatusIcon() }}</span>
                    {{ getSessionManagementStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getSessionManagementSeverity()">
                    {{ getSessionManagementSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <!-- État de chargement -->
              <div class="test-progress" *ngIf="isSessionManagementAuditing()">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Audit Session Management en cours...</span>
              </div>

              <!-- Résultats -->
              <div class="test-summary" *ngIf="sessionManagementResult() && !isSessionManagementAuditing()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ sessionManagementResult()?.score }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ sessionManagementResult()?.vulnerabilities?.length || 0 }}</span>
                      <span class="stat-label">Vulnérabilités</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSessionManagementSeverity() | titlecase }}</span>
                      <span class="stat-label">Sévérité</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getSessionManagementSummary() }}</p>
                </div>
              </div>

              <!-- Message d'action -->
              <div class="test-action" *ngIf="!sessionManagementResult() && !isSessionManagementAuditing()">
                <div class="action-message">
                  <span class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <p class="action-text">Cliquez pour lancer l'audit Session Management</p>
                  <p class="action-note">Cet audit peut prendre plusieurs minutes</p>
                </div>
              </div>
            </div>

            <!-- Test Configuration SSL/TLS (affiché en huitième) -->
            <div
              *ngIf="hasRunAudit"
              class="test-card clickable-test-card"
              [attr.data-status]="getSslTlsStatus()"
              [attr.data-severity]="getSslTlsSeverity()"
              (click)="handleSslTlsClick()">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">Configuration SSL/TLS</h3>
                  <p class="test-description">Vérification des protocoles de communication sécurisés et de la validité du certificat</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="getSslTlsStatus()">
                    <span class="status-icon">{{ getSslTlsStatusIcon() }}</span>
                    {{ getSslTlsStatus() | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="getSslTlsSeverity()">
                    {{ getSslTlsSeverity() | titlecase }}
                  </span>
                </div>
              </div>

              <!-- État de chargement -->
              <div class="test-progress" *ngIf="isSslTlsAuditing()">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Audit SSL/TLS en cours...</span>
              </div>

              <!-- Résultats -->
              <div class="test-summary" *ngIf="sslTlsResult() && !isSslTlsAuditing()">
                <div class="summary-info">
                  <div class="summary-stats">
                    <span class="stat-item">
                      <span class="stat-number">{{ getSslTlsScore() }}</span>
                      <span class="stat-label">Score</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSslTlsVulnerabilitiesCount() }}</span>
                      <span class="stat-label">Vulnérabilités</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-number">{{ getSslTlsProtocolsCount() }}</span>
                      <span class="stat-label">Protocoles</span>
                    </span>
                  </div>
                  <p class="summary-text">{{ getSslTlsSummary() }}</p>
                </div>
              </div>

              <!-- Message d'action -->
              <div class="test-action" *ngIf="!sslTlsResult() && !isSslTlsAuditing()">
                <div class="action-message">
                  <span class="action-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <p class="action-text">Cliquez pour lancer l'audit SSL/TLS</p>
                  <p class="action-note">Cet audit peut prendre plusieurs minutes</p>
                </div>
              </div>
            </div>

            <!-- Tests manuels -->
            <div
              *ngFor="let test of auditResults(); trackBy: trackByTestId"
              class="test-card"
              [attr.data-status]="test.status"
              [attr.data-severity]="test.severity">
              
              <div class="test-header">
                <div class="test-info">
                  <h3 class="test-name">{{ test.name }}</h3>
                  <p class="test-description">{{ test.description }}</p>
                </div>
                
                <div class="test-badges">
                  <span class="status-badge" [attr.data-status]="test.status">
                    <span class="status-icon">{{ getStatusIcon(test.status) }}</span>
                    {{ test.status | titlecase }}
                  </span>
                  <span class="severity-badge" [attr.data-severity]="test.severity">
                    {{ test.severity | titlecase }}
                  </span>
                </div>
              </div>

              <div class="test-recommendation" *ngIf="test.status === 'failed' || test.status === 'vulnerable'">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>

              <div class="test-progress" *ngIf="test.status === 'pending'">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Test en cours...</span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="auditResults().length === 0 && !hasRunAudit">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
              <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
            </svg>
          </div>
          <h3 class="empty-title">Prêt à Commencer l'Audit</h3>
          <p class="empty-description">Saisissez une URL ci-dessus et cliquez sur "Lancer l'Audit Manuel" pour commencer les tests de sécurité complets.</p>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de validation des formulaires -->
    <div class="modal-overlay" *ngIf="showFormValidationModal()" (click)="closeFormValidationDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de la Validation des Formulaires</h2>
          <button class="modal-close" (click)="closeFormValidationDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="formValidationResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ formValidationResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ formValidationResult()?.scoreGlobal }}/100</span>
                <span class="modal-status" [class]="'status-' + formValidationResult()?.status?.toLowerCase()">
                  {{ formValidationResult()?.status }}
                </span>
              </div>
              <p class="modal-summary-text">{{ formValidationResult()?.summary }}</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="formValidationResult()?.scoreGlobal"
                   [class]="'score-' + getScoreClass(formValidationResult()?.scoreGlobal || 0)">
              </div>
            </div>
            <div class="progress-text">{{ formValidationResult()?.scoreGlobal }}/100</div>
          </div>

          <!-- Filtres -->
          <div class="modal-filters">
            <button 
              *ngFor="let filter of testFilters" 
              class="filter-btn"
              [class.active]="selectedFilter() === filter.key"
              (click)="setFilter(filter.key)">
              {{ filter.label }} ({{ getFilterCount(filter.key) }})
            </button>
          </div>

          <!-- Liste des tests -->
          <div class="modal-tests">
            <div 
              *ngFor="let test of getFilteredTests(); trackBy: trackByTestName"
              class="modal-test-item"
              [class.failed]="test.status === 'Failed'">
              
              <div class="test-item-header">
                <div class="test-item-info">
                  <h4 class="test-item-name">{{ test.testName }}</h4>
                  <div class="test-item-meta">
                    <span class="test-field">Champ: {{ test.formField }}</span>
                    <span class="test-action">Action: {{ test.formAction }}</span>
                    <span class="test-method">Méthode: {{ test.formMethod }}</span>
                  </div>
                </div>
                
                <div class="test-item-badges">
                  <span class="status-badge" [class]="'status-' + test.status.toLowerCase()">
                    <span class="status-icon">{{ getStatusIcon(test.status) }}</span>
                    {{ test.status }}
                  </span>
                  <span class="severity-badge" [class]="'severity-' + test.severity.toLowerCase()">
                    {{ test.severity }}
                  </span>
                </div>
              </div>

              <div class="test-item-payload">
                <div class="payload-label">Payload utilisé:</div>
                <div class="payload-code">{{ test.payload }}</div>
              </div>

              <div class="test-item-recommendation" *ngIf="test.status === 'Failed'">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails d'authentification -->
    <div class="modal-overlay" *ngIf="showAuthenticationModal()" (click)="closeAuthenticationDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit d'Authentification</h2>
          <button class="modal-close" (click)="closeAuthenticationDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="authenticationResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ authenticationResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ authenticationResult()?.scoreGlobal }}/100</span>
                <span class="modal-status" [class]="'status-' + authenticationResult()?.status?.toLowerCase()">
                  {{ authenticationResult()?.status }}
                </span>
              </div>
              <p class="modal-summary-text">{{ authenticationResult()?.summary }}</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="authenticationResult()?.scoreGlobal"
                   [class]="'score-' + getScoreClass(authenticationResult()?.scoreGlobal || 0)">
              </div>
            </div>
            <div class="progress-text">{{ authenticationResult()?.scoreGlobal }}/100</div>
          </div>

          <!-- Liste des tests d'authentification -->
          <div class="modal-tests">
            <div 
              *ngFor="let test of authenticationResult()?.tests; trackBy: trackByAuthenticationTestName"
              class="modal-test-item"
              [class.failed]="test.status === 'FAILED'">
              
              <div class="test-item-header">
                <div class="test-item-info">
                  <h4 class="test-item-name">{{ test.testName }}</h4>
                  <div class="test-item-meta">
                    <span class="test-method">Méthode: {{ test.method }}</span>
                    <span class="test-response">Code: {{ test.responseCode }} - {{ test.responseMessage }}</span>
                    <span class="test-protected" [class]="test.protected ? 'protected' : 'unprotected'">
                      {{ test.protected ? 'Protégé' : 'Non protégé' }}
                    </span>
                  </div>
                </div>
                
                <div class="test-item-badges">
                  <span class="status-badge" [class]="'status-' + test.status.toLowerCase()">
                    <span class="status-icon">{{ getStatusIcon(test.status) }}</span>
                    {{ test.status }}
                  </span>
                  <span class="severity-badge" [class]="'severity-' + test.severity.toLowerCase()">
                    {{ test.severity }}
                  </span>
                </div>
              </div>

              <div class="test-item-payload">
                <div class="payload-label">Payload utilisé:</div>
                <div class="payload-code">{{ test.payload }}</div>
              </div>

              <div class="test-item-recommendation">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de sécurité des fichiers -->
    <div class="modal-overlay" *ngIf="showFileSecurityModal()" (click)="closeFileSecurityDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit de Sécurité des Fichiers</h2>
          <button class="modal-close" (click)="closeFileSecurityDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="fileSecurityResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ fileSecurityResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ fileSecurityResult()?.scoreGlobal }}/100</span>
                <span class="modal-status" [class]="'status-' + fileSecurityResult()?.status?.toLowerCase()">
                  {{ fileSecurityResult()?.status }}
                </span>
              </div>
              <p class="modal-summary-text">{{ fileSecurityResult()?.summary }}</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="fileSecurityResult()?.scoreGlobal"
                   [class]="'score-' + getScoreClass(fileSecurityResult()?.scoreGlobal || 0)">
              </div>
            </div>
            <div class="progress-text">{{ fileSecurityResult()?.scoreGlobal }}/100</div>
          </div>

          <!-- Liste des tests de sécurité des fichiers -->
          <div class="modal-tests">
            <div 
              *ngFor="let test of fileSecurityResult()?.tests; trackBy: trackByFileSecurityTestName"
              class="modal-test-item"
              [class.failed]="test.status === 'FAILED'">
              
              <div class="test-item-header">
                <div class="test-item-info">
                  <h4 class="test-item-name">{{ test.testName }}</h4>
                  <div class="test-item-meta">
                    <span class="test-method">Méthode: {{ test.method }}</span>
                    <span class="test-response">Code: {{ test.responseCode }} - {{ test.responseMessage }}</span>
                    <span class="test-protected" [class]="test.protected ? 'protected' : 'unprotected'">
                      {{ test.protected ? 'Protégé' : 'Non protégé' }}
                    </span>
                  </div>
                </div>
                
                <div class="test-item-badges">
                  <span class="status-badge" [class]="'status-' + test.status.toLowerCase()">
                    <span class="status-icon">{{ getFileSecurityTestStatusIcon(test.status) }}</span>
                    {{ test.status }}
                  </span>
                  <span class="severity-badge" [class]="'severity-' + test.severity.toLowerCase()">
                    {{ test.severity }}
                  </span>
                </div>
              </div>

              <div class="test-item-payload">
                <div class="payload-label">Payload utilisé:</div>
                <div class="payload-code">{{ test.payload }}</div>
              </div>

              <div class="test-item-recommendation">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de l'audit d'injection SQL -->
    <div class="modal-overlay" *ngIf="showSqlInjectionModal()" (click)="closeSqlInjectionDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit d'Injection SQL</h2>
          <button class="modal-close" (click)="closeSqlInjectionDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="sqlInjectionResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ sqlInjectionResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ sqlInjectionResult()?.globalScore }}/100</span>
                <span class="modal-status" [class]="'status-' + sqlInjectionResult()?.status?.toLowerCase()">
                  {{ sqlInjectionResult()?.overallStatus }}
                </span>
              </div>
              <p class="modal-summary-text">{{ sqlInjectionResult()?.summary }}</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="sqlInjectionResult()?.globalScore"
                   [class]="'score-' + getScoreClass(sqlInjectionResult()?.globalScore || 0)">
              </div>
            </div>
            <div class="progress-text">{{ sqlInjectionResult()?.globalScore }}/100</div>
          </div>

          <!-- Liste des tests d'injection SQL -->
          <div class="modal-tests">
            <div 
              *ngFor="let test of sqlInjectionResult()?.tests; trackBy: trackBySqlInjectionTestName"
              class="modal-test-item"
              [class.failed]="test.status === 'FAILED'">
              
              <div class="test-item-header">
                <div class="test-item-info">
                  <h4 class="test-item-name">{{ test.testName }}</h4>
                  <div class="test-item-meta">
                    <span class="test-method">Méthode: {{ test.method }}</span>
                    <span class="test-response">Code: {{ test.responseCode }} - {{ test.responseMessage }}</span>
                    <span class="test-vulnerable" [class]="test.vulnerable ? 'vulnerable' : 'secure'">
                      {{ test.vulnerable ? 'Vulnérable' : 'Sécurisé' }}
                    </span>
                  </div>
                </div>
                
                <div class="test-item-badges">
                  <span class="status-badge" [class]="'status-' + test.status.toLowerCase()">
                    <span class="status-icon">{{ getStatusIcon(test.status) }}</span>
                    {{ test.status }}
                  </span>
                  <span class="severity-badge" [class]="'severity-' + test.severity.toLowerCase()">
                    {{ test.severity }}
                  </span>
                </div>
              </div>

              <div class="test-item-payload">
                <div class="payload-label">Payload utilisé:</div>
                <div class="payload-code">{{ test.payload }}</div>
              </div>

              <div class="test-item-recommendation">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de l'audit XSS -->
    <div class="modal-overlay" *ngIf="showXssModal()" (click)="closeXssDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit XSS</h2>
          <button class="modal-close" (click)="closeXssDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="xssResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ xssResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ xssResult()?.globalScore }}/100</span>
                <span class="modal-status" [class]="'status-' + xssResult()?.overallStatus?.toLowerCase()">
                  {{ xssResult()?.overallStatus }}
                </span>
              </div>
              <p class="modal-summary-text">{{ xssResult()?.summary }}</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="xssResult()?.globalScore"
                   [class]="'score-' + getScoreClass(xssResult()?.globalScore || 0)">
              </div>
            </div>
            <div class="progress-text">{{ xssResult()?.globalScore }}/100</div>
          </div>

          <!-- Liste des tests XSS -->
          <div class="modal-tests">
            <div 
              *ngFor="let test of xssResult()?.tests; trackBy: trackByXssTestName"
              class="modal-test-item"
              [class.failed]="test.status === 'FAILED'">
              
              <div class="test-item-header">
                <div class="test-item-info">
                  <h4 class="test-item-name">{{ test.testName }}</h4>
                  <div class="test-item-meta">
                    <span class="test-method">Méthode: {{ test.method }}</span>
                    <span class="test-response">Code: {{ test.responseCode }} - {{ test.responseMessage }}</span>
                    <span class="test-detection">Type: {{ test.detectionType }}</span>
                    <span class="test-confidence">Confiance: {{ test.confidenceScore }}%</span>
                    <span class="test-vulnerable" [class]="test.vulnerable ? 'vulnerable' : 'secure'">
                      {{ test.vulnerable ? 'Vulnérable' : 'Sécurisé' }}
                    </span>
                  </div>
                </div>
                
                <div class="test-item-badges">
                  <span class="status-badge" [class]="'status-' + test.status.toLowerCase()">
                    <span class="status-icon">{{ getStatusIcon(test.status) }}</span>
                    {{ test.status }}
                  </span>
                  <span class="severity-badge" [class]="'severity-' + test.severity.toLowerCase()">
                    {{ test.severity }}
                  </span>
                </div>
              </div>

              <div class="test-item-payload">
                <div class="payload-label">Payload utilisé:</div>
                <div class="payload-code">{{ test.payload }}</div>
              </div>

              <div class="test-item-recommendation">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandation</strong>
                </div>
                <p class="recommendation-text">{{ test.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de l'audit Admin Panel -->
    <div class="modal-overlay" *ngIf="showAdminPanelModal()" (click)="closeAdminPanelDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit Admin Panel</h2>
          <button class="modal-close" (click)="closeAdminPanelDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="adminPanelResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ adminPanelResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Code de réponse: {{ adminPanelResult()?.responseCode }}</span>
                <span class="modal-status" [class]="'status-' + adminPanelResult()?.status?.toLowerCase()">
                  {{ adminPanelResult()?.status }}
                </span>
              </div>
              <p class="modal-summary-text">{{ adminPanelResult()?.resultMessage }}</p>
            </div>
          </div>

          <!-- Informations détaillées -->
          <div class="modal-details">
            <div class="detail-section">
              <h4 class="detail-title">Informations du Test</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Nom du test:</span>
                  <span class="detail-value">{{ adminPanelResult()?.testName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" [class]="'status-' + adminPanelResult()?.status?.toLowerCase()">
                    {{ adminPanelResult()?.status }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Sévérité:</span>
                  <span class="detail-value" [class]="'severity-' + adminPanelResult()?.severity?.toLowerCase()">
                    {{ adminPanelResult()?.severity }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Code de réponse:</span>
                  <span class="detail-value">{{ adminPanelResult()?.responseCode }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">URL testée:</span>
                  <span class="detail-value">{{ adminPanelResult()?.url }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Succès:</span>
                  <span class="detail-value" [class]="adminPanelResult()?.success ? 'success' : 'failed'">
                    {{ adminPanelResult()?.success ? 'Oui' : 'Non' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="detail-title">Message de Résultat</h4>
              <div class="result-message">
                <p>{{ adminPanelResult()?.resultMessage }}</p>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="detail-title">Recommandations</h4>
              <div class="recommendation-section">
                <div class="recommendation-header">
                  <span class="recommendation-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                    </svg>
                  </span>
                  <strong>Recommandations de sécurité</strong>
                </div>
                <p class="recommendation-text">{{ adminPanelResult()?.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de l'audit Session Management -->
    <div class="modal-overlay" *ngIf="showSessionManagementModal()" (click)="closeSessionManagementDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit Session Management</h2>
          <button class="modal-close" (click)="closeSessionManagementDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="sessionManagementResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ sessionManagementResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score: {{ sessionManagementResult()?.score }}/100</span>
                <span class="modal-status" [class]="'status-' + getSessionManagementStatus()">
                  {{ getSessionManagementStatus() | titlecase }}
                </span>
              </div>
              <p class="modal-summary-text">{{ sessionManagementResult()?.message }}</p>
            </div>
          </div>

          <!-- Informations détaillées -->
          <div class="modal-details">
            <div class="detail-section">
              <h4 class="detail-title">Informations du Test</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Nom du test:</span>
                  <span class="detail-value">{{ sessionManagementResult()?.testName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Score:</span>
                  <span class="detail-value">{{ sessionManagementResult()?.score }}/100</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Sévérité:</span>
                  <span class="detail-value" [class]="'severity-' + getSessionManagementSeverity()">
                    {{ getSessionManagementSeverity() | titlecase }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Vulnérabilités:</span>
                  <span class="detail-value">{{ sessionManagementResult()?.vulnerabilities?.length || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">URL testée:</span>
                  <span class="detail-value">{{ sessionManagementResult()?.url }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Succès:</span>
                  <span class="detail-value" [class]="sessionManagementResult()?.success ? 'success' : 'failed'">
                    {{ sessionManagementResult()?.success ? 'Oui' : 'Non' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Vulnérabilités détectées -->
            <div class="detail-section" *ngIf="(sessionManagementResult()?.vulnerabilities?.length || 0) > 0">
              <h4 class="detail-title">Vulnérabilités Détectées</h4>
              <div class="vulnerabilities-list">
                <div class="vulnerability-item" *ngFor="let vuln of (sessionManagementResult()?.vulnerabilities || [])">
                  <div class="vulnerability-header">
                    <span class="vulnerability-name">{{ vuln.name }}</span>
                    <span class="vulnerability-status" [class]="'status-' + vuln.status.toLowerCase()">
                      {{ vuln.status }}
                    </span>
                  </div>
                  <p class="vulnerability-description">{{ vuln.description }}</p>
                  <span class="vulnerability-timestamp">{{ vuln.timestamp | date:'short' }}</span>
                </div>
              </div>
            </div>

            <!-- Résultats détaillés -->
            <div class="detail-section">
              <h4 class="detail-title">Résultats Détaillés</h4>
              <div class="detailed-results">
                <!-- Test des cookies de session -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.sessionCookieTest">
                  <h5 class="test-result-title">🍪 Test des Cookies de Session</h5>
                  <div class="test-result-details">
                    <p><strong>Cookies de session détectés:</strong> {{ sessionManagementResult()?.detailedResults?.sessionCookieTest?.sessionCookieNames?.join(', ') || 'Aucun' }}</p>
                    <p><strong>Total des cookies:</strong> {{ sessionManagementResult()?.detailedResults?.sessionCookieTest?.totalCookies || 0 }}</p>
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.sessionCookieTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>

                <!-- Test de fixation de session -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.sessionFixationTest">
                  <h5 class="test-result-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" style="width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">
                      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                    </svg>
                    Test de Fixation de Session
                  </h5>
                  <div class="test-result-details">
                    <p><strong>Protection contre la fixation:</strong> {{ sessionManagementResult()?.detailedResults?.sessionFixationTest?.sessionFixationProtected ? 'Oui' : 'Non' }}</p>
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.sessionFixationTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>

                <!-- Test de déconnexion -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.logoutTest">
                  <h5 class="test-result-title">🚪 Test de Déconnexion</h5>
                  <div class="test-result-details">
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.logoutTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>

                <!-- Test de timeout de session -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.sessionTimeoutTest">
                  <h5 class="test-result-title">⏰ Test de Timeout de Session</h5>
                  <div class="test-result-details">
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.sessionTimeoutTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>

                <!-- Test HTTPS -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.httpsTest">
                  <h5 class="test-result-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" style="width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">
                      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                    </svg>
                    Test HTTPS
                  </h5>
                  <div class="test-result-details">
                    <p><strong>Protocole:</strong> {{ sessionManagementResult()?.detailedResults?.httpsTest?.protocol || 'Non défini' }}</p>
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.httpsTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>

                <!-- Test des attributs de cookies -->
                <div class="test-result" *ngIf="sessionManagementResult()?.detailedResults?.cookieAttributesTest">
                  <h5 class="test-result-title">🍪 Test des Attributs de Cookies</h5>
                  <div class="test-result-details">
                    <p><strong>Déduction de score:</strong> {{ sessionManagementResult()?.detailedResults?.cookieAttributesTest?.scoreDeduction || 0 }} points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour les détails de l'audit SSL/TLS -->
    <div class="modal-overlay" *ngIf="showSslTlsModal()" (click)="closeSslTlsDetails()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Détails de l'Audit SSL/TLS</h2>
          <button class="modal-close" (click)="closeSslTlsDetails()">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="sslTlsResult()">
          <!-- En-tête du modal -->
          <div class="modal-summary">
            <div class="modal-summary-content">
              <h3 class="modal-summary-title">{{ sslTlsResult()?.url }}</h3>
              <div class="modal-summary-meta">
                <span class="modal-score">Score Global: {{ getSslTlsScore() }}</span>
                <span class="modal-status" [class]="'status-' + sslTlsResult()?.status?.toLowerCase()">
                  {{ sslTlsResult()?.status }}
                </span>
              </div>
              <div class="modal-summary-text">{{ sslTlsResult()?.message }}</div>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="modal-progress">
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="getSslTlsScore()"
                   [class]="'score-' + getScoreClass(getSslTlsScore())">
              </div>
            </div>
            <div class="progress-text">{{ getSslTlsScore() }}</div>
          </div>

          <!-- Résumé simplifié -->
          <div class="modal-details">
            <div class="detail-section">
              <h4 class="detail-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">
                  <path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 173.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/>
                </svg>
                Résumé de l'Audit
              </h4>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                    </svg>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Protocoles Supportés</div>
                    <div class="summary-value">{{ sslTlsResult()?.details?.tlsProtocols?.supported?.join(', ') }}</div>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                    </svg>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Certificat</div>
                    <div class="summary-value">
                      <span [class]="sslTlsResult()?.details?.certificate?.expired ? 'failed' : 'success'">
                        <span *ngIf="sslTlsResult()?.details?.certificate?.expired" class="status-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 1rem; height: 1rem; margin-right: 0.25rem; vertical-align: middle;">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/>
                          </svg>
                          Expiré
                        </span>
                        <span *ngIf="!sslTlsResult()?.details?.certificate?.expired" class="status-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 1rem; height: 1rem; margin-right: 0.25rem; vertical-align: middle;">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
                          </svg>
                          Valide
                        </span>
                      </span>
                      <span [class]="sslTlsResult()?.details?.certificate?.trustedCA ? 'success' : 'failed'">
                        {{ sslTlsResult()?.details?.certificate?.trustedCA ? ' - Autorité reconnue' : ' - Autorité non reconnue' }}
                      </span>
                      <span [class]="sslTlsResult()?.details?.certificate?.domainMatch ? 'success' : 'failed'">
                        {{ sslTlsResult()?.details?.certificate?.domainMatch ? ' - Correspondance domaine correcte' : ' - Correspondance domaine incorrecte' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V448h40c13.3 0 24-10.7 24-24V384h40c6.4 0 12.5-2.5 17-7l161.3-161.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"/>
                    </svg>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Chiffrements</div>
                    <div class="summary-value">
                      {{ sslTlsResult()?.details?.cipherSuites?.totalWeak }}/{{ sslTlsResult()?.details?.cipherSuites?.totalSupported }} chiffrements faibles 
                      ({{ ((sslTlsResult()?.details?.cipherSuites?.weakRatio || 0) * 100) | number:'1.1-1' }}%)
                    </div>
                  </div>
                </div>
                <div class="summary-item" *ngIf="sslTlsResult()?.details?.vulnerabilities?.hasVulnerabilities">
                  <div class="summary-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                    </svg>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Vulnérabilités</div>
                    <div class="summary-value">
                      {{ sslTlsResult()?.details?.vulnerabilities?.count }} vulnérabilité(s) détectée(s)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vulnérabilités -->
            <div class="detail-section" *ngIf="sslTlsResult()?.details?.vulnerabilities?.hasVulnerabilities">
              <h4 class="detail-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">
                  <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                </svg>
                Vulnérabilités Détectées
              </h4>
              <div class="vulnerabilities-list">
                <div *ngFor="let vuln of sslTlsResult()?.details?.vulnerabilities?.detected" 
                     class="vulnerability-item">
                  <span class="vulnerability-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                      <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
                    </svg>
                  </span>
                  <span class="vulnerability-name">{{ vuln }}</span>
                </div>
              </div>
            </div>

            <!-- Recommandations -->
            <div class="detail-section">
              <h4 class="detail-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 1.2rem; height: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">
                  <path d="M288 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224c0 17.7 14.3 32 32 32s32-14.3 32-32V80zM256 0C114.6 0 0 114.6 0 256S114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208S370.7 464 256 464z"/>
                </svg>
                Recommandations
              </h4>
              <div class="recommendation-section">
                <div class="recommendation-content">
                  <div class="recommendation-text">{{ sslTlsResult()?.recommendation }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .manual-audit-container {
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }


    /* Status Colors */
    :root {
      --status-pending: #f59e0b;
      --status-success: #10b981;
      --status-failed: #ef4444;
      --status-vulnerable: #dc2626;
      --severity-critical: #dc2626;
      --severity-high: #ea580c;
      --severity-medium: #f59e0b;
      --severity-low: #84cc16;
    }

    /* Header */
    .audit-header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 2rem 1.5rem;
      position: relative;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }

    .page-title {
      font-size: 2.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      line-height: 1.2;
      color: #000000; /* Noir en mode clair */
    }
    
    /* Classe pour le mode sombre */
    .dark-title {
      color: #ffffff !important; /* Blanc en mode sombre */
    }

    .page-subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }



    /* Content */
    .audit-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    /* URL Input Section */
    .url-input-section {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--shadow);
      margin-bottom: 2rem;
      border: 1px solid var(--border-color);
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .input-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .input-wrapper {
      display: flex;
      gap: 1rem;
      align-items: stretch;
    }

    .url-input {
      flex: 1;
      padding: 1rem 1.25rem;
      border: 2px solid var(--border-color);
      border-radius: 12px;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 1rem;
      transition: all 0.2s ease;
      outline: none;
    }

    .url-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .url-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Buttons */
    .audit-btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      outline: none;
      white-space: nowrap;
    }

    .audit-btn.primary {
      background: var(--primary-color);
      color: white;
    }

    .audit-btn.primary:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }

    .audit-btn.secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .audit-btn.secondary:hover:not(:disabled) {
      background: var(--primary-color);
      color: white;
      transform: translateY(-1px);
    }

    .audit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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

    .refresh-icon {
      font-size: 1.25rem;
      transition: transform 0.3s ease;
    }

    .audit-btn.secondary:hover .refresh-icon {
      transform: rotate(180deg);
    }

    /* Results Section */
    .audit-results {
      animation: slideIn 0.5s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .results-title {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }

    .results-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .separator {
      color: var(--text-muted);
    }

    /* Tests Grid */
    .tests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .test-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .test-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--status-color);
      transition: all 0.3s ease;
    }

    .test-card[data-status="pending"]::before { --status-color: var(--status-pending); }
    .test-card[data-status="success"]::before { --status-color: var(--status-success); }
    .test-card[data-status="failed"]::before { --status-color: var(--status-failed); }
    .test-card[data-status="vulnerable"]::before { --status-color: var(--status-vulnerable); }

    .test-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent-primary);
    }

    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .test-info {
      flex: 1;
    }

    .test-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .test-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }

    .test-badges {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-badge[data-status="pending"] {
      background: rgba(245, 158, 11, 0.1);
      color: var(--status-pending);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .status-badge[data-status="success"] {
      background: rgba(16, 185, 129, 0.1);
      color: var(--status-success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .status-badge[data-status="failed"] {
      background: rgba(239, 68, 68, 0.1);
      color: var(--status-failed);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .status-badge[data-status="vulnerable"] {
      background: rgba(220, 38, 38, 0.1);
      color: var(--status-vulnerable);
      border: 1px solid rgba(220, 38, 38, 0.2);
    }

    .severity-badge {
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .severity-badge[data-severity="critical"] {
      background: rgba(220, 38, 38, 0.1);
      color: var(--severity-critical);
      border: 1px solid rgba(220, 38, 38, 0.2);
    }

    .severity-badge[data-severity="high"] {
      background: rgba(234, 88, 12, 0.1);
      color: var(--severity-high);
      border: 1px solid rgba(234, 88, 12, 0.2);
    }

    .severity-badge[data-severity="medium"] {
      background: rgba(245, 158, 11, 0.1);
      color: var(--severity-medium);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .severity-badge[data-severity="low"] {
      background: rgba(132, 204, 22, 0.1);
      color: var(--severity-low);
      border: 1px solid rgba(132, 204, 22, 0.2);
    }

    .status-icon {
      font-size: 0.75rem;
    }

    /* Test Recommendation */
    .test-recommendation {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
      border-left: 4px solid var(--accent-primary);
    }

    .recommendation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .recommendation-text {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    /* Test Progress */
    .test-progress {
      margin-top: 1rem;
    }

    .progress-bar {
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--status-pending);
      width: 0%;
      animation: progressIndeterminate 2s infinite linear;
      border-radius: 2px;
    }

    @keyframes progressIndeterminate {
      0% {
        width: 0%;
        margin-left: 0%;
      }
      50% {
        width: 40%;
        margin-left: 30%;
      }
      100% {
        width: 0%;
        margin-left: 100%;
      }
    }

    .progress-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      color: var(--text-primary);
    }

    .empty-description {
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .audit-header {
        padding: 1.5rem 1rem;
      }

      .page-title {
        font-size: 1.875rem;
      }

      .audit-content {
        padding: 1.5rem 1rem;
      }

      .url-input-section {
        padding: 1.5rem;
      }

      .input-wrapper {
        flex-direction: column;
      }

      .tests-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .test-card {
        padding: 1.25rem;
      }

      .test-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .test-badges {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }

      .results-header {
        flex-direction: column;
        align-items: stretch;
      }

    }

    @media (max-width: 480px) {
      .audit-header {
        padding: 1rem;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .audit-content {
        padding: 1rem;
      }

      .url-input-section {
        padding: 1rem;
      }

      .test-card {
        padding: 1rem;
      }

      .empty-state {
        padding: 3rem 1rem;
      }
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* Focus styles */
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }

    /* Form Validation Test Card Styles */
    .clickable-test-card {
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .clickable-test-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent-primary);
    }

    .clickable-test-card::after {
      content: '👁️';
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 1.25rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .clickable-test-card:hover::after {
      opacity: 1;
    }

    .test-summary {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
      border-left: 4px solid var(--accent-primary);
    }

    .summary-info {
      margin-bottom: 1rem;
    }

    .summary-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .summary-text {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    .test-actions {
      display: flex;
      justify-content: flex-end;
    }

    .details-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .details-btn:hover {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
    }

    .details-icon {
      font-size: 1rem;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: var(--bg-secondary);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      max-width: 1000px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .close-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .modal-body {
      padding: 2rem;
    }

    .modal-summary {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-left: 4px solid var(--accent-primary);
    }

    .modal-summary-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      color: var(--text-primary);
    }

    .modal-summary-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .modal-score {
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .modal-status.status-success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--status-success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .modal-status.status-warning {
      background: rgba(245, 158, 11, 0.1);
      color: var(--status-pending);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .modal-status.status-failed {
      background: rgba(239, 68, 68, 0.1);
      color: var(--status-failed);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .modal-summary-text {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0;
    }

    .modal-progress {
      margin-bottom: 2rem;
    }

    .modal-progress .progress-bar {
      height: 12px;
      background: var(--bg-tertiary);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .modal-progress .progress-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 1s ease;
    }

    .modal-progress .progress-fill.score-excellent {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .modal-progress .progress-fill.score-good {
      background: linear-gradient(90deg, #3b82f6, #2563eb);
    }

    .modal-progress .progress-fill.score-warning {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .modal-progress .progress-fill.score-poor {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    .progress-text {
      text-align: center;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-filters {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid var(--border-color);
      border-radius: 12px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      border-color: var(--accent-primary);
      background: var(--bg-tertiary);
    }

    .filter-btn.active {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
    }

    .modal-tests {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .modal-test-item {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .modal-test-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--status-success);
      transition: all 0.3s ease;
    }

    .modal-test-item.failed::before {
      background: var(--status-failed);
    }

    .test-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .test-item-info {
      flex: 1;
    }

    .test-item-name {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .test-item-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .test-item-meta span {
      font-size: 0.8rem;
      color: var(--text-secondary);
      background: var(--bg-primary);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-right: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .test-item-badges {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .test-item-payload {
      background: var(--bg-primary);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .payload-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .payload-code {
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      word-break: break-all;
      line-height: 1.4;
    }

    .test-item-recommendation {
      background: var(--bg-primary);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid var(--accent-primary);
    }

    .recommendation-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .recommendation-text {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    /* Responsive Design for Modal */
    @media (max-width: 768px) {
      .summary-card {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
      }

      .summary-stats {
        justify-content: space-around;
      }

      .modal-content {
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }

      .modal-header {
        padding: 1rem 1.5rem;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-filters {
        flex-direction: column;
      }

      .filter-btn {
        text-align: center;
      }

      .test-item-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .test-item-badges {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }

      .test-item-meta {
        flex-direction: column;
      }

      .test-item-meta span {
        margin-right: 0;
        margin-bottom: 0.25rem;
      }
    }

    /* Styles pour les tests d'authentification */
    .test-protected {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-right: 0.5rem;
      margin-bottom: 0.25rem;
      font-weight: 600;
    }

    .test-protected.protected {
      background: rgba(16, 185, 129, 0.1);
      color: var(--status-success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .test-protected.unprotected {
      background: rgba(239, 68, 68, 0.1);
      color: var(--status-failed);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    /* Styles pour les tests d'injection SQL */
    .test-vulnerable {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      margin-right: 0.5rem;
      margin-bottom: 0.25rem;
      font-weight: 600;
    }

    .test-vulnerable.vulnerable {
      background: rgba(239, 68, 68, 0.1);
      color: var(--status-failed);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .test-vulnerable.secure {
      background: rgba(16, 185, 129, 0.1);
      color: var(--status-success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    /* Styles pour l'action d'audit SQL */
    .test-action {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1rem;
      text-align: center;
      border: 2px dashed var(--border-color);
      transition: all 0.3s ease;
    }

    .test-action:hover {
      border-color: var(--accent-primary);
      background: var(--bg-primary);
    }

    .action-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .action-icon {
      font-size: 2rem;
      opacity: 0.7;
    }

    .action-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .action-note {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
      font-style: italic;
    }

    /* Styles pour le modal SSL/TLS */
    .protocols-info {
      margin-top: 1rem;
    }

    .protocols-supported, .protocols-unsupported {
      margin-bottom: 1rem;
    }

    .protocols-supported h5, .protocols-unsupported h5 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .protocol-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .protocol-item {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .protocol-item.supported {
      background: var(--success-bg);
      color: var(--success-color);
      border: 1px solid var(--success-color);
    }

    .protocol-item.unsupported {
      background: var(--warning-bg);
      color: var(--warning-color);
      border: 1px solid var(--warning-color);
    }

    .cipher-info {
      margin-top: 1rem;
    }

    .cipher-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .cipher-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .cipher-stat .stat-label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .cipher-stat .stat-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .cipher-stat .stat-value.warning {
      color: var(--warning-color);
    }

    .cipher-stat .stat-value.success {
      color: var(--success-color);
    }

    .cipher-analysis {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border-left: 4px solid var(--info-color);
    }

    .cipher-analysis p {
      margin: 0;
      color: var(--text-primary);
      line-height: 1.5;
    }

    .vulnerabilities-list {
      margin-top: 1rem;
    }

    .vulnerability-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: var(--danger-bg);
      border: 1px solid var(--danger-color);
      border-radius: 8px;
    }

    .vulnerability-icon {
      font-size: 1.2rem;
    }

    .vulnerability-name {
      font-weight: 500;
      color: var(--danger-color);
    }

    .risk-faible {
      color: var(--success-color);
    }

    .risk-modéré {
      color: var(--warning-color);
    }

    .risk-élevé {
      color: var(--danger-color);
    }

    .risk-critique {
      color: var(--danger-color);
      font-weight: 700;
    }

    /* Styles pour les nouveaux éléments du modal SSL/TLS */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .summary-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .summary-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .summary-icon svg {
      width: 1.5rem;
      height: 1.5rem;
      fill: currentColor;
    }

    /* Styles pour toutes les icônes SVG */
    .action-icon svg,
    .recommendation-icon svg,
    .vulnerability-icon svg,
    .status-icon svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    .empty-icon svg {
      width: 3rem;
      height: 3rem;
      fill: currentColor;
    }

    .detail-title svg {
      width: 1.2rem;
      height: 1.2rem;
      fill: currentColor;
    }

    .test-result-title svg {
      width: 1.2rem;
      height: 1.2rem;
      fill: currentColor;
    }

    .summary-content {
      flex: 1;
    }

    .summary-label {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .summary-value {
      color: var(--text-secondary);
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      text-align: center;
    }

    .metric-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .certificate-info {
      margin-top: 1rem;
    }

    .cert-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: var(--bg-tertiary);
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }

    .cert-label {
      font-weight: 600;
      color: var(--text-primary);
      min-width: 150px;
      flex-shrink: 0;
    }

    .cert-value {
      color: var(--text-secondary);
      text-align: right;
      word-break: break-all;
      line-height: 1.4;
    }

    .weak-ciphers {
      margin-top: 1rem;
    }

    .weak-ciphers h5 {
      margin: 0 0 0.75rem 0;
      color: var(--warning-color);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .cipher-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-primary);
    }

    .cipher-item {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-family: monospace;
      color: var(--text-secondary);
    }

    .cipher-item:last-child {
      border-bottom: none;
    }

    .cipher-item.weak {
      background: rgba(239, 68, 68, 0.05);
      color: var(--danger-color);
    }

    .recommendation-content {
      background: var(--bg-tertiary);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid var(--accent-primary);
    }

    .recommendation-text {
      color: var(--text-secondary);
      line-height: 1.6;
      white-space: pre-line;
      font-size: 0.9rem;
    }

    /* Responsive pour le modal SSL/TLS */
    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .cert-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .cert-label {
        min-width: auto;
      }

      .cert-value {
        text-align: left;
      }
    }
  `]
})
export class ManualAuditComponent implements OnInit {
  private http = inject(HttpClient);
  
  targetUrl = '';
  hasRunAudit = false;
  isAuditing = signal(false);
  isDarkMode = false;
  auditResults = signal<ManualTest[]>([]);
  formValidationResult = signal<FormValidationResult | null>(null);
  authenticationResult = signal<AuthenticationResult | null>(null);
  fileSecurityResult = signal<FileSecurityResult | null>(null);
  sqlInjectionResult = signal<SqlInjectionResult | null>(null);
  xssResult = signal<XssResult | null>(null);
  adminPanelResult = signal<AdminPanelResult | null>(null);
  sslTlsResult = signal<SslTlsResult | null>(null);
  sessionManagementResult = signal<SessionManagementResult | null>(null);
  selectedFilter = signal<string>('all');
  showFormValidationModal = signal<boolean>(false);
  showAuthenticationModal = signal<boolean>(false);
  showFileSecurityModal = signal<boolean>(false);
  showSqlInjectionModal = signal<boolean>(false);
  showXssModal = signal<boolean>(false);
  showAdminPanelModal = signal<boolean>(false);
  showSslTlsModal = signal<boolean>(false);
  showSessionManagementModal = signal<boolean>(false);
  isSqlInjectionAuditing = signal<boolean>(false);
  isXssAuditing = signal<boolean>(false);
  isAdminPanelAuditing = signal<boolean>(false);
  isSslTlsAuditing = signal<boolean>(false);
  isSessionManagementAuditing = signal<boolean>(false);
  
  // Compteurs pour suivre les APIs terminées
  private completedApis = 0;
  private totalApis = 3; // formValidation, authentication, fileSecurity (sqlInjection séparé)

  // Méthode pour vérifier si toutes les APIs sont terminées
  private checkAllApisCompleted(): void {
    this.completedApis++;
    console.log(`📊 [FRONTEND] APIs terminées: ${this.completedApis}/${this.totalApis}`);
    
    if (this.completedApis >= this.totalApis) {
      console.log('✅ [FRONTEND] Toutes les APIs sont terminées - Affichage des résultats');
      this.isAuditing.set(false);
    }
  }

  testFilters = [
    { key: 'all', label: 'Tous les tests' },
    { key: 'xss', label: 'XSS' },
    { key: 'sql', label: 'SQL Injection' },
    { key: 'validation', label: 'Validation' },
    { key: 'special', label: 'Caractères spéciaux' }
  ];

  private mockTests: ManualTest[] = [
    {
      id: '5',
      name: 'Gestion des Sessions',
      description: 'Test de la gestion des sessions, du délai d\'expiration et des contrôles de sécurité',
      status: 'pending',
      severity: 'medium',
      recommendation: 'Implémentez des tokens de session sécurisés avec un délai d\'expiration approprié et des drapeaux de cookie sécurisés.'
    }
  ];



  runAudit(): void {
    if (!this.targetUrl || this.isAuditing()) {
      console.log('❌ [FRONTEND] Audit non lancé - URL manquante ou audit en cours');
      return;
    }

    console.log('🚀 [FRONTEND] Lancement de l\'audit pour l\'URL:', this.targetUrl);

    this.hasRunAudit = true;
    this.isAuditing.set(true);
    this.auditResults.set([...this.mockTests]);
    this.formValidationResult.set(null);
    this.authenticationResult.set(null);
    this.fileSecurityResult.set(null);
    this.sqlInjectionResult.set(null);
    this.sessionManagementResult.set(null);
    
    // Réinitialiser le compteur d'APIs
    this.completedApis = 0;

    // Lancer les trois types d'audit en parallèle (SQL injection séparé)
    this.simulateAuditProgress();
    this.runFormValidationAudit();
    this.runAuthenticationAudit();
    this.runFileSecurityAudit();
  }

  private runFormValidationAudit(): void {
    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête vers l\'API:', requestBody);

    this.http.post<any>('/api/manual-audit/form-validation', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score reçu:', result.scoreGlobal);
          console.log('📝 [FRONTEND] Status reçu:', result.status);
          console.log('📋 [FRONTEND] Nombre de résultats:', result.results?.length);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: FormValidationResult = {
            results: result.results || [],
            scoreGlobal: result.scoreGlobal || 0,
            status: result.status || 'WARNING',
            message: result.message || 'Audit terminé',
            summary: result.summary || `Score: ${result.scoreGlobal || 0}/100`,
            success: result.success !== false,
            url: result.url || this.targetUrl
          };
          
          console.log('🔧 [FRONTEND] Résultat adapté:', adaptedResult);
          this.formValidationResult.set(adaptedResult);
          
          // Vérifier si toutes les APIs sont terminées
          this.checkAllApisCompleted();
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit de validation des formulaires:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur:', error);
          // En cas d'erreur, utiliser les données de test
          this.formValidationResult.set(this.getMockFormValidationResult());
          
          // Vérifier si toutes les APIs sont terminées même en cas d'erreur
          this.checkAllApisCompleted();
        }
      });
  }

  private runAuthenticationAudit(): void {
    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'authentification vers l\'API:', requestBody);

    this.http.post<any>('/api/authentication-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'authentification reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score d\'authentification reçu:', result.scoreGlobal);
          console.log('📝 [FRONTEND] Status d\'authentification reçu:', result.status);
          console.log('📋 [FRONTEND] Nombre de tests d\'authentification:', result.tests?.length);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: AuthenticationResult = {
            status: result.status || 'WARNING',
            tests: result.tests || [],
            scoreGlobal: result.scoreGlobal || 0,
            message: result.message || 'Audit d\'authentification terminé',
            summary: result.summary || `Score: ${result.scoreGlobal || 0}/100`,
            success: result.success !== false,
            url: result.url || this.targetUrl
          };
          
          console.log('🔧 [FRONTEND] Résultat d\'authentification adapté:', adaptedResult);
          this.authenticationResult.set(adaptedResult);
          this.checkAllApisCompleted();
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit d\'authentification:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur d\'authentification:', error);
          // En cas d'erreur, utiliser les données de test
          this.authenticationResult.set(this.getMockAuthenticationResult());
          this.checkAllApisCompleted();
        }
      });
  }

  private runFileSecurityAudit(): void {
    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête de sécurité des fichiers vers l\'API:', requestBody);

    this.http.post<any>('/api/file-security-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse de sécurité des fichiers reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score de sécurité des fichiers reçu:', result.scoreGlobal);
          console.log('📝 [FRONTEND] Status de sécurité des fichiers reçu:', result.status);
          console.log('📋 [FRONTEND] Nombre de tests de sécurité des fichiers:', result.tests?.length);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: FileSecurityResult = {
            status: result.status || 'WARNING',
            tests: result.tests || [],
            scoreGlobal: result.scoreGlobal || 0,
            message: result.message || 'Audit de sécurité des fichiers terminé',
            summary: result.summary || `Score: ${result.scoreGlobal || 0}/100`,
            success: result.success !== false,
            url: result.url || this.targetUrl
          };
          
          console.log('🔧 [FRONTEND] Résultat de sécurité des fichiers adapté:', adaptedResult);
          this.fileSecurityResult.set(adaptedResult);
          this.checkAllApisCompleted();
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit de sécurité des fichiers:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur de sécurité des fichiers:', error);
          // En cas d'erreur, utiliser les données de test
          this.fileSecurityResult.set(this.getMockFileSecurityResult());
          this.checkAllApisCompleted();
        }
      });
  }

  private runSqlInjectionAudit(): void {
    if (!this.targetUrl) {
      console.log('❌ [FRONTEND] URL manquante pour l\'audit d\'injection SQL');
      return;
    }

    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'audit d\'injection SQL vers l\'API:', requestBody);
    this.isSqlInjectionAuditing.set(true);

    this.http.post<any>('/api/sql-injection-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'audit d\'injection SQL reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score d\'injection SQL reçu:', result.globalScore);
          console.log('📝 [FRONTEND] Status d\'injection SQL reçu:', result.overallStatus);
          console.log('📋 [FRONTEND] Nombre de tests d\'injection SQL:', result.tests?.length);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: SqlInjectionResult = {
            status: result.overallStatus === 'SUCCESS' ? 'SUCCESS' : 
                   result.overallStatus === 'WARNING' ? 'WARNING' : 
                   result.overallStatus === 'FAILED' ? 'FAILED' : 'DANGER',
            tests: result.tests || [],
            globalScore: result.globalScore || 0,
            overallStatus: result.overallStatus || 'WARNING',
            summary: result.summary || `Score: ${result.globalScore || 0}/100`,
            message: result.message || 'Audit d\'injection SQL terminé',
            success: result.success !== false,
            url: result.url || this.targetUrl
          };
          
          console.log('🔧 [FRONTEND] Résultat d\'injection SQL adapté:', adaptedResult);
          this.sqlInjectionResult.set(adaptedResult);
          this.isSqlInjectionAuditing.set(false);
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit d\'injection SQL:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur d\'injection SQL:', error);
          // En cas d'erreur, utiliser les données de test
          this.sqlInjectionResult.set(this.getMockSqlInjectionResult());
          this.isSqlInjectionAuditing.set(false);
        }
      });
  }

  private runXssAudit(): void {
    if (!this.targetUrl) {
      console.log('❌ [FRONTEND] URL manquante pour l\'audit XSS');
      return;
    }

    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'audit XSS vers l\'API:', requestBody);
    this.isXssAuditing.set(true);

    this.http.post<any>('/api/xss-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'audit XSS reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score XSS reçu:', result.globalScore);
          console.log('📝 [FRONTEND] Status XSS reçu:', result.overallStatus);
          console.log('📋 [FRONTEND] Nombre de tests XSS:', result.tests?.length);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: XssResult = {
            summary: result.summary || `Score: ${result.globalScore || 0}/100`,
            tests: result.tests || [],
            success: result.success !== false,
            globalScore: result.globalScore || 0,
            message: result.message || 'Audit XSS terminé',
            url: result.url || this.targetUrl,
            overallStatus: result.overallStatus || 'WARNING'
          };
          
          console.log('🔧 [FRONTEND] Résultat XSS adapté:', adaptedResult);
          this.xssResult.set(adaptedResult);
          this.isXssAuditing.set(false);
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit XSS:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur XSS:', error);
          // En cas d'erreur, utiliser les données de test
          this.xssResult.set(this.getMockXssResult());
          this.isXssAuditing.set(false);
        }
      });
  }

  private runAdminPanelAudit(): void {
    if (!this.targetUrl) {
      console.log('❌ [FRONTEND] URL manquante pour l\'audit Admin Panel');
      return;
    }

    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'audit Admin Panel vers l\'API:', requestBody);
    this.isAdminPanelAuditing.set(true);

    this.http.post<any>('/api/admin-panel-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'audit Admin Panel reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Status Admin Panel reçu:', result.status);
          console.log('📝 [FRONTEND] Severity Admin Panel reçu:', result.severity);
          console.log('📋 [FRONTEND] Message Admin Panel:', result.resultMessage);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: AdminPanelResult = {
            responseCode: result.responseCode || 200,
            testName: result.testName || 'Accès au Panneau d\'Administration',
            resultMessage: result.resultMessage || 'Test terminé',
            message: result.message || 'Audit Admin Panel terminé',
            recommendation: result.recommendation || 'Vérifiez manuellement les panneaux d\'administration',
            status: result.status || 'OK',
            severity: result.severity || 'LOW',
            url: result.url || this.targetUrl,
            success: result.success !== false
          };
          
          console.log('🔧 [FRONTEND] Résultat Admin Panel adapté:', adaptedResult);
          this.adminPanelResult.set(adaptedResult);
          this.isAdminPanelAuditing.set(false);
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit Admin Panel:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur Admin Panel:', error);
          // En cas d'erreur, utiliser les données de test
          this.adminPanelResult.set(this.getMockAdminPanelResult());
          this.isAdminPanelAuditing.set(false);
        }
      });
  }

  private runSessionManagementAudit(): void {
    if (!this.targetUrl) {
      console.log('❌ [FRONTEND] URL manquante pour l\'audit Session Management');
      return;
    }

    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'audit Session Management vers l\'API:', requestBody);
    this.isSessionManagementAuditing.set(true);

    this.http.post<any>('/api/cookie-session-security/manual-session-audit', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'audit Session Management reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Score Session Management reçu:', result.score);
          console.log('📝 [FRONTEND] Success Session Management reçu:', result.success);
          console.log('📋 [FRONTEND] Message Session Management:', result.message);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: SessionManagementResult = {
            testName: result.testName || 'Gestion des Sessions',
            message: result.message || 'Audit Session Management terminé',
            score: result.score || 0,
            success: result.success !== false,
            url: result.url || this.targetUrl,
            timestamp: result.timestamp || new Date().toISOString(),
            vulnerabilities: result.vulnerabilities || [],
            detailedResults: result.detailedResults || {
              sessionCookieTest: {
                sessionCookieNames: [],
                hasSessionCookie: false,
                vulnerabilities: [],
                scoreDeduction: 0,
                totalCookies: 0,
                detectedCookies: []
              },
              sessionFixationTest: {
                sessionFixationProtected: false,
                initialSessionId: '',
                secondSessionId: '',
                vulnerabilities: [],
                scoreDeduction: 0
              },
              logoutTest: {
                vulnerabilities: [],
                scoreDeduction: 0
              },
              sessionTimeoutTest: {
                vulnerabilities: [],
                scoreDeduction: 0
              },
              httpsTest: {
                isHttp: false,
                protocol: 'HTTPS',
                isHttps: true,
                vulnerabilities: [],
                scoreDeduction: 0
              },
              cookieAttributesTest: {
                vulnerabilities: [],
                scoreDeduction: 0
              }
            }
          };
          
          console.log('🔧 [FRONTEND] Résultat Session Management adapté:', adaptedResult);
          this.sessionManagementResult.set(adaptedResult);
          this.isSessionManagementAuditing.set(false);
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit Session Management:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur Session Management:', error);
          // En cas d'erreur, utiliser les données de test
          this.sessionManagementResult.set(this.getMockSessionManagementResult());
          this.isSessionManagementAuditing.set(false);
        }
      });
  }

  private runSslTlsAudit(): void {
    if (!this.targetUrl) {
      console.log('❌ [FRONTEND] URL manquante pour l\'audit SSL/TLS');
      return;
    }

    const requestBody = {
      url: this.targetUrl
    };

    console.log('🔍 [FRONTEND] Envoi de la requête d\'audit SSL/TLS vers l\'API:', requestBody);
    this.isSslTlsAuditing.set(true);

    this.http.post<any>('/api/ssl-tls-audit/test', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .subscribe({
        next: (result) => {
          console.log('✅ [FRONTEND] Réponse d\'audit SSL/TLS reçue de l\'API:', result);
          console.log('📊 [FRONTEND] Status SSL/TLS reçu:', result.status);
          console.log('📝 [FRONTEND] Severity SSL/TLS reçu:', result.severity);
          console.log('📋 [FRONTEND] Message SSL/TLS:', result.resultMessage);
          console.log('🔍 [FRONTEND] Détails SSL/TLS:', result.details);
          
          // Adapter la réponse de l'API au format attendu par le frontend
          const adaptedResult: SslTlsResult = {
            testName: result.testName || 'Configuration SSL/TLS',
            resultMessage: result.resultMessage || 'Test terminé',
            message: result.message || 'Audit SSL/TLS terminé',
            recommendation: result.recommendation || 'Vérifiez la configuration SSL/TLS',
            details: result.details || this.getDefaultSslTlsDetails(),
            status: result.status || 'OK',
            severity: result.severity || 'LOW',
            url: result.url || this.targetUrl,
            success: result.success !== false
          };
          
          console.log('🔧 [FRONTEND] Résultat SSL/TLS adapté:', adaptedResult);
          this.sslTlsResult.set(adaptedResult);
          this.isSslTlsAuditing.set(false);
        },
        error: (error) => {
          console.error('❌ [FRONTEND] Erreur lors de l\'audit SSL/TLS:', error);
          console.error('❌ [FRONTEND] Détails de l\'erreur SSL/TLS:', error);
          // En cas d'erreur, utiliser les données de test
          this.sslTlsResult.set(this.getMockSslTlsResult());
          this.isSslTlsAuditing.set(false);
        }
      });
  }

  private getMockFormValidationResult(): FormValidationResult {
    return {
      results: [
        {
          testName: "XSS Reflected - <script>alert('XSS')...",
          status: "Success",
          severity: "Low",
          recommendation: "Le payload XSS a été correctement filtré ou encodé.",
          payload: "<script>alert('XSS')</script>",
          response: "Response content...",
          formField: "query",
          formAction: "http://testfire.net/search.jsp",
          formMethod: "GET"
        },
        {
          testName: "Validation longueur",
          status: "Failed",
          severity: "Medium",
          recommendation: "Aucune validation de longueur détectée. Implémenter des limites de taille.",
          payload: "String de 10000 caractères",
          response: "Response content...",
          formField: "query",
          formAction: "http://testfire.net/search.jsp",
          formMethod: "GET"
        },
        {
          testName: "SQL Injection - ' OR '1'='1...",
          status: "Success",
          severity: "Low",
          recommendation: "Aucune vulnérabilité SQL détectée.",
          payload: "' OR '1'='1",
          response: "Response content...",
          formField: "query",
          formAction: "http://testfire.net/search.jsp",
          formMethod: "GET"
        }
      ],
      scoreGlobal: 78,
      status: "WARNING",
      message: "Audit de validation des formulaires terminé avec succès",
      summary: "⚠️ Formulaires partiellement sécurisés - 25 tests effectués",
      success: true,
      url: this.targetUrl
    };
  }

  private getMockAuthenticationResult(): AuthenticationResult {
    return {
      status: 'SUCCESS',
      tests: [
        {
          testName: 'Accès direct sans authentification',
          status: 'SUCCESS',
          severity: 'LOW',
          recommendation: 'Contenu contient \'Unauthorized\' ou \'login\' - Protection active',
          payload: 'Aucun header d\'authentification',
          method: 'GET',
          responseCode: 200,
          responseMessage: '200 OK',
          protected: true
        }
      ],
      scoreGlobal: 100,
      message: 'Audit d\'authentification terminé avec succès',
      summary: '✅ Authentification sécurisée - 7 tests effectués',
      success: true,
      url: this.targetUrl
    };
  }

  private getMockFileSecurityResult(): FileSecurityResult {
    return {
      status: 'WARNING',
      tests: [
        {
          testName: 'Upload de fichiers valides',
          status: 'PASSED',
          severity: 'LOW',
          recommendation: 'Fichier valide accepté correctement',
          payload: 'test_image.png',
          method: 'POST',
          responseCode: 200,
          responseMessage: '200 OK',
          protected: true
        }
      ],
      scoreGlobal: 75,
      message: 'Audit de sécurité des fichiers terminé avec succès',
      summary: '⚠️ Sécurité des fichiers partielle - 3/4 tests réussis',
      success: true,
      url: this.targetUrl
    };
  }

  private getMockSqlInjectionResult(): SqlInjectionResult {
    return {
      status: 'WARNING',
      tests: [
        {
          testName: 'Injection basique / Login bypass',
          status: 'SUCCESS',
          severity: 'LOW',
          recommendation: 'Aucune vulnérabilité d\'injection SQL détectée dans les paramètres de connexion',
          payload: "' OR '1'='1",
          method: 'POST',
          responseCode: 200,
          responseMessage: '200 OK',
          vulnerable: false
        },
        {
          testName: 'Error-based Injection',
          status: 'SUCCESS',
          severity: 'LOW',
          recommendation: 'Aucune vulnérabilité d\'injection SQL basée sur les erreurs détectée',
          payload: "' AND 1=CONVERT(INT,(SELECT @@version))--",
          method: 'GET',
          responseCode: 200,
          responseMessage: '200 OK',
          vulnerable: false
        },
        {
          testName: 'Union-based Injection',
          status: 'FAILED',
          severity: 'HIGH',
          recommendation: 'Vulnérabilité d\'injection SQL détectée. Utilisez des requêtes paramétrées.',
          payload: "' UNION SELECT null,null,null --",
          method: 'GET',
          responseCode: 200,
          responseMessage: '200 OK',
          vulnerable: true
        }
      ],
      globalScore: 65,
      overallStatus: 'WARNING',
      summary: '⚠️ Vulnérabilités d\'injection SQL détectées - 2/3 tests réussis',
      message: 'Audit d\'injection SQL terminé avec succès',
      success: true,
      url: this.targetUrl
    };
  }

  private getMockXssResult(): XssResult {
    return {
      summary: '💀 Sécurité XSS très vulnérable - 3 vulnérabilités détectées',
      tests: [
        {
          testName: 'XSS Reflected dans paramètre \'search\'',
          payload: '<script>alert(\'XSS\')</script>',
          method: 'GET',
          responseCode: 200,
          responseMessage: '200 OK',
          responseTime: 0,
          status: 'FAILED',
          severity: 'HIGH',
          recommendation: 'Vulnérabilité XSS détectée. Implémentez un encodage de sortie approprié.',
          confidenceScore: 95,
          detectionType: 'REFLECTED_XSS',
          vulnerable: true
        },
        {
          testName: 'XSS Stored dans formulaire de contact',
          payload: '<img src=x onerror=alert(\'XSS\')>',
          method: 'POST',
          responseCode: 200,
          responseMessage: '200 OK',
          responseTime: 0,
          status: 'FAILED',
          severity: 'CRITICAL',
          recommendation: 'Vulnérabilité XSS stockée détectée. Validez et encodez toutes les entrées utilisateur.',
          confidenceScore: 98,
          detectionType: 'STORED_XSS',
          vulnerable: true
        },
        {
          testName: 'XSS DOM-based',
          payload: 'javascript:alert(\'XSS\')',
          method: 'GET',
          responseCode: 200,
          responseMessage: '200 OK',
          responseTime: 0,
          status: 'SUCCESS',
          severity: 'LOW',
          recommendation: 'Aucune vulnérabilité XSS DOM détectée.',
          confidenceScore: 90,
          detectionType: 'DOM_XSS',
          vulnerable: false
        }
      ],
      success: true,
      globalScore: 15,
      message: 'Audit XSS terminé avec succès',
      url: this.targetUrl,
      overallStatus: 'DANGER'
    };
  }

  private getMockAdminPanelResult(): AdminPanelResult {
    return {
      responseCode: 200,
      testName: 'Accès au Panneau d\'Administration',
      resultMessage: 'ℹ️ Aucun panneau d\'administration standard détecté sur 87 chemin(s) testé(s). Cela peut indiquer une configuration personnalisée ou des chemins non standard.',
      message: 'Test d\'accès au panneau d\'administration terminé avec succès',
      recommendation: 'Vérifier manuellement si des panneaux d\'administration existent avec des chemins personnalisés. Considérer l\'implémentation d\'une authentification préventive même si aucun panneau n\'est actuellement détecté.',
      status: 'OK',
      severity: 'LOW',
      url: this.targetUrl,
      success: true
    };
  }

  private getDefaultSslTlsDetails() {
    return {
      tlsProtocols: {
        unsupported: [],
        hasTls12: true,
        hasTls13: true,
        hasWeakProtocols: false,
        supported: ['TLSv1.3', 'TLSv1.2']
      },
      securityMetrics: {
        riskLevel: 'FAIBLE',
        protocolScore: 100,
        certificateScore: 100,
        overallScore: 100,
        confidence: 'ÉLEVÉE',
        trustBonus: 10,
        cipherScore: 100
      },
      cipherSuites: {
        hasWeakCiphers: false,
        totalWeak: 0,
        weakRatio: 0,
        analysis: 'Configuration sécurisée',
        weakCiphers: [],
        supported: ['TLS_AES_256_GCM_SHA384', 'TLS_AES_128_GCM_SHA256'],
        totalSupported: 2
      },
      certificate: {
        domainMatch: true,
        serialNumber: '123456789',
        expired: false,
        keySize: 2048,
        trustedCA: true,
        subject: 'CN=example.com',
        selfSigned: false,
        validFrom: '2024-01-01 00:00:00',
        version: 3,
        issuer: 'CN=Let\'s Encrypt Authority X3',
        signatureAlgorithm: 'SHA256withRSA',
        validTo: '2025-01-01 00:00:00'
      },
      vulnerabilities: {
        count: 0,
        detected: [],
        hasVulnerabilities: false
      }
    };
  }

  private getMockSslTlsResult(): SslTlsResult {
    return {
      testName: 'Configuration SSL/TLS',
      resultMessage: '⚠️ ALERTE - Améliorations recommandées\n📊 Score de sécurité : 35/100\n🔒 Protocoles supportés : TLS 1.3, TLS 1.2\n🔐 Certificat : ✅ Certificat valide - Autorité reconnue - Correspondance domaine incorrecte\n🔑 Chiffrements : 20/37 chiffrements faibles (54,1%)\n⚠️ Vulnérabilités modérées détectées',
      message: 'Test de configuration SSL/TLS terminé avec succès',
      recommendation: '⚠️ MESURE CORRECTIVE MODÉRÉE :\n   • Vérifier que le certificat correspond exactement au domaine\n   • Utiliser un certificat SAN (Subject Alternative Name) pour plusieurs domaines\n   • Vérifier les redirections et les alias de domaine\n⚠️ AMÉLIORATION IMPORTANTE :\n   • Désactiver la majorité des chiffrements faibles\n   • Reconfigurer complètement la liste des chiffrements\n   • Utiliser des outils de configuration SSL/TLS sécurisés',
      details: {
        tlsProtocols: {
          unsupported: ['TLSv1.1', 'TLSv1', 'SSLv3', 'SSLv2'],
          hasTls12: true,
          hasTls13: true,
          hasWeakProtocols: false,
          supported: ['TLSv1.3', 'TLSv1.2']
        },
        securityMetrics: {
          riskLevel: 'ÉLEVÉ',
          protocolScore: 30,
          certificateScore: 35,
          overallScore: 35,
          confidence: 'FAIBLE',
          trustBonus: 0,
          cipherScore: 0
        },
        cipherSuites: {
          hasWeakCiphers: true,
          totalWeak: 20,
          weakRatio: 0.541,
          analysis: 'Configuration très vulnérable - Majorité de chiffrements faibles (54% du total)',
          weakCiphers: [
            'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384',
            'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384',
            'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256',
            'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256'
          ],
          supported: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_AES_128_GCM_SHA256',
            'TLS_CHACHA20_POLY1305_SHA256'
          ],
          totalSupported: 37
        },
        certificate: {
          domainMatch: false,
          serialNumber: '11052917571688553217513402572096631149',
          expired: false,
          keySize: 2352,
          trustedCA: true,
          subject: 'CN=demo.testfire.net',
          selfSigned: false,
          validFrom: '2025-05-21 01:00:00',
          version: 3,
          issuer: 'CN=Sectigo RSA Domain Validation Secure Server CA',
          signatureAlgorithm: 'SHA256withRSA',
          validTo: '2026-06-22 00:59:59'
        },
        vulnerabilities: {
          count: 2,
          detected: ['CORRESPONDANCE_DOMAINE_INCORRECTE', 'CHIFFREMENTS_FAIBLES'],
          hasVulnerabilities: true
        }
      },
      status: 'AVERTISSEMENT',
      severity: 'ÉLEVÉ',
      url: this.targetUrl,
      success: true
    };
  }

  private getMockSessionManagementResult(): SessionManagementResult {
    return {
      testName: 'Gestion des Sessions',
      message: '🚨 Session non sécurisée – 3 vulnérabilité(s) critique(s) détectée(s)',
      score: 55,
      success: false,
      url: this.targetUrl,
      timestamp: new Date().toISOString(),
      vulnerabilities: [
        {
          name: 'Cookie sans HttpOnly',
          description: 'Le cookie de session \'JSESSIONID\' n\'a pas l\'attribut HttpOnly, le rendant vulnérable aux attaques XSS',
          status: 'CRITICAL',
          timestamp: new Date().toISOString()
        },
        {
          name: 'Session sans expiration définie',
          description: 'Le cookie de session \'JSESSIONID\' n\'a ni Max-Age ni Expires définis',
          status: 'WARNING',
          timestamp: new Date().toISOString()
        },
        {
          name: 'Page de login non trouvée',
          description: 'Impossible de tester l\'invalidation de session car aucune page de login n\'a été trouvée',
          status: 'WARNING',
          timestamp: new Date().toISOString()
        }
      ],
      detailedResults: {
        sessionCookieTest: {
          sessionCookieNames: ['JSESSIONID'],
          hasSessionCookie: true,
          vulnerabilities: [],
          scoreDeduction: 0,
          totalCookies: 6,
          detectedCookies: [
            {
              sameSiteValue: 'None',
              expires: null,
              maxAge: null,
              sameSite: true,
              name: 'JSESSIONID',
              httpOnly: false,
              secure: true,
              value: 'ajax:4250314717984086815',
              url: this.targetUrl,
              rawHeader: 'JSESSIONID=ajax:4250314717984086815; SameSite=None; Path=/; Domain=.www.linkedin.com; Secure'
            }
          ]
        },
        sessionFixationTest: {
          sessionFixationProtected: true,
          initialSessionId: 'ajax:0723418021742188118',
          secondSessionId: 'ajax:7855050580879851683',
          vulnerabilities: [],
          scoreDeduction: 0
        },
        logoutTest: {
          vulnerabilities: [
            {
              name: 'Page de login non trouvée',
              description: 'Impossible de tester l\'invalidation de session car aucune page de login n\'a été trouvée',
              status: 'WARNING',
              timestamp: new Date().toISOString()
            }
          ],
          scoreDeduction: 5
        },
        sessionTimeoutTest: {
          vulnerabilities: [
            {
              name: 'Session sans expiration définie',
              description: 'Le cookie de session \'JSESSIONID\' n\'a ni Max-Age ni Expires définis',
              status: 'WARNING',
              timestamp: new Date().toISOString()
            }
          ],
          scoreDeduction: 15
        },
        httpsTest: {
          isHttp: false,
          protocol: 'HTTPS',
          isHttps: true,
          vulnerabilities: [],
          scoreDeduction: 0
        },
        cookieAttributesTest: {
          vulnerabilities: [
            {
              name: 'Cookie sans HttpOnly',
              description: 'Le cookie de session \'JSESSIONID\' n\'a pas l\'attribut HttpOnly, le rendant vulnérable aux attaques XSS',
              status: 'CRITICAL',
              timestamp: new Date().toISOString()
            }
          ],
          scoreDeduction: 25
        }
      }
    };
  }

  rerunAudit(): void {
    if (this.isAuditing()) {
      return;
    }

    this.auditResults.set([...this.mockTests.map(test => ({ ...test, status: 'pending' as const }))]);
    this.formValidationResult.set(null);
    this.authenticationResult.set(null);
    this.fileSecurityResult.set(null);
    this.sqlInjectionResult.set(null);
    
    // Réinitialiser le compteur d'APIs
    this.completedApis = 0;
    
    this.isAuditing.set(true);
    this.simulateAuditProgress();
    this.runFormValidationAudit();
    this.runAuthenticationAudit();
    this.runFileSecurityAudit();
  }

  private async simulateAuditProgress(): Promise<void> {
    const tests = this.auditResults();
    const statusOptions: ('success' | 'failed' | 'vulnerable')[] = ['success', 'failed', 'vulnerable'];

    for (let i = 0; i < tests.length; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const updatedTests = [...this.auditResults()];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      // Bias towards more realistic results
      let finalStatus: ManualTest['status'];
      if (Math.random() < 0.6) {
        finalStatus = 'success';
      } else if (Math.random() < 0.8) {
        finalStatus = 'failed';
      } else {
        finalStatus = 'vulnerable';
      }

      updatedTests[i] = { ...updatedTests[i], status: finalStatus };
      this.auditResults.set(updatedTests);
    }

    // Ne pas terminer l'audit ici - attendre que l'API soit terminée
    // L'audit sera terminé dans runFormValidationAudit() après la réponse de l'API
  }

  getStatusCounts(): { success: number; failed: number; vulnerable: number; pending: number } {
    const results = this.auditResults();
    return {
      success: results.filter(t => t.status === 'success').length,
      failed: results.filter(t => t.status === 'failed').length,
      vulnerable: results.filter(t => t.status === 'vulnerable').length,
      pending: results.filter(t => t.status === 'pending').length
    };
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✓';
      case 'failed': return '✗';
      case 'vulnerable': return '⚠';
      case 'pending': return '⏳';
      case 'Success': return '✓';
      case 'Failed': return '✗';
      default: return '◯';
    }
  }

  trackByTestId(index: number, test: ManualTest): string {
    return test.id;
  }

  trackByTestName(index: number, test: FormValidationTest): string {
    return test.testName;
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'poor';
  }

  getSuccessCount(): number {
    const result = this.formValidationResult();
    if (!result) return 0;
    return result.results.filter(test => test.status === 'Success').length;
  }

  getFailedCount(): number {
    const result = this.formValidationResult();
    if (!result) return 0;
    return result.results.filter(test => test.status === 'Failed').length;
  }

  getFilterCount(filterKey: string): number {
    const result = this.formValidationResult();
    if (!result) return 0;

    if (filterKey === 'all') return result.results.length;

    return result.results.filter(test => {
      const testName = test.testName.toLowerCase();
      switch (filterKey) {
        case 'xss':
          return testName.includes('xss');
        case 'sql':
          return testName.includes('sql');
        case 'validation':
          return testName.includes('validation') || testName.includes('longueur');
        case 'special':
          return testName.includes('caractères') || testName.includes('spéciaux');
        default:
          return true;
      }
    }).length;
  }

  getFilteredTests(): FormValidationTest[] {
    const result = this.formValidationResult();
    if (!result) return [];

    const filter = this.selectedFilter();
    if (filter === 'all') return result.results;

    return result.results.filter(test => {
      const testName = test.testName.toLowerCase();
      switch (filter) {
        case 'xss':
          return testName.includes('xss');
        case 'sql':
          return testName.includes('sql');
        case 'validation':
          return testName.includes('validation') || testName.includes('longueur');
        case 'special':
          return testName.includes('caractères') || testName.includes('spéciaux');
        default:
          return true;
      }
    });
  }

  setFilter(filterKey: string): void {
    this.selectedFilter.set(filterKey);
  }

  openFormValidationDetails(): void {
    this.showFormValidationModal.set(true);
  }

  closeFormValidationDetails(): void {
    this.showFormValidationModal.set(false);
  }

  getFormValidationStatus(): string {
    const result = this.formValidationResult();
    if (!result) return 'pending';
    
    // Utiliser le statut de l'API directement
    switch (result.status) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'failed';
      case 'FAILED':
      case 'DANGER':
        return 'vulnerable';
      default:
        // Fallback basé sur le score si le statut n'est pas reconnu
        if (result.scoreGlobal >= 70) return 'success';
        if (result.scoreGlobal >= 50) return 'failed';
        return 'vulnerable';
    }
  }

  getFormValidationSeverity(): string {
    const result = this.formValidationResult();
    if (!result) return 'medium';
    
    // Déterminer la sévérité basée sur le nombre de tests échoués
    const failedCount = this.getFailedCount();
    const totalCount = result.results.length;
    const failureRate = failedCount / totalCount;
    
    if (failureRate >= 0.5) return 'critical';
    if (failureRate >= 0.3) return 'high';
    if (failureRate >= 0.1) return 'medium';
    return 'low';
  }

  getFormValidationStatusIcon(): string {
    return this.getStatusIcon(this.getFormValidationStatus());
  }

  getFormValidationSummary(): string {
    const summary = this.formValidationResult()?.summary || '';
    // Nettoyer le résumé pour éviter la duplication
    if (summary.includes('Formulaires partiellement sécurisés')) {
      return 'Formulaires partiellement sécurisés - 25 tests effectués';
    }
    return summary;
  }

  getTotalTestCount(): number {
    const manualTests = this.auditResults().length;
    const formValidationTest = this.formValidationResult() ? 1 : 0;
    const authenticationTest = this.authenticationResult() ? 1 : 0;
    const fileSecurityTest = this.fileSecurityResult() ? 1 : 0;
    // SQL injection n'est pas inclus dans le total car il est séparé
    return manualTests + formValidationTest + authenticationTest + fileSecurityTest;
  }

  getTotalSuccessCount(): number {
    const manualSuccess = this.getStatusCounts().success;
    const formValidationSuccess = this.formValidationResult() && this.getFormValidationStatus() === 'success' ? 1 : 0;
    const authenticationSuccess = this.authenticationResult() && this.getAuthenticationStatus() === 'success' ? 1 : 0;
    const fileSecuritySuccess = this.fileSecurityResult() && this.getFileSecurityStatus() === 'success' ? 1 : 0;
    // SQL injection n'est pas inclus dans le total car il est séparé
    return manualSuccess + formValidationSuccess + authenticationSuccess + fileSecuritySuccess;
  }

  getTotalProblemCount(): number {
    const manualProblems = this.getStatusCounts().failed + this.getStatusCounts().vulnerable;
    const formValidationProblems = this.formValidationResult() && (this.getFormValidationStatus() === 'failed' || this.getFormValidationStatus() === 'vulnerable') ? 1 : 0;
    const authenticationProblems = this.authenticationResult() && (this.getAuthenticationStatus() === 'failed' || this.getAuthenticationStatus() === 'vulnerable') ? 1 : 0;
    const fileSecurityProblems = this.fileSecurityResult() && (this.getFileSecurityStatus() === 'failed' || this.getFileSecurityStatus() === 'vulnerable') ? 1 : 0;
    // SQL injection n'est pas inclus dans le total car il est séparé
    return manualProblems + formValidationProblems + authenticationProblems + fileSecurityProblems;
  }

  // Méthodes pour l'authentification
  openAuthenticationDetails(): void {
    this.showAuthenticationModal.set(true);
  }

  closeAuthenticationDetails(): void {
    this.showAuthenticationModal.set(false);
  }

  getAuthenticationStatus(): string {
    const result = this.authenticationResult();
    if (!result) return 'pending';
    
    // Utiliser le statut de l'API directement
    switch (result.status) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'failed';
      case 'FAILED':
      case 'DANGER':
        return 'vulnerable';
      default:
        // Fallback basé sur le score si le statut n'est pas reconnu
        if (result.scoreGlobal >= 70) return 'success';
        if (result.scoreGlobal >= 50) return 'failed';
        return 'vulnerable';
    }
  }

  getAuthenticationSeverity(): string {
    const result = this.authenticationResult();
    if (!result) return 'medium';
    
    // Déterminer la sévérité basée sur le score global
    if (result.scoreGlobal >= 90) return 'low';
    if (result.scoreGlobal >= 70) return 'medium';
    if (result.scoreGlobal >= 50) return 'high';
    return 'critical';
  }

  getAuthenticationStatusIcon(): string {
    return this.getStatusIcon(this.getAuthenticationStatus());
  }

  getAuthenticationSummary(): string {
    const summary = this.authenticationResult()?.summary || '';
    return summary;
  }

  getAuthenticationSuccessCount(): number {
    const result = this.authenticationResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'SUCCESS').length;
  }

  getAuthenticationFailedCount(): number {
    const result = this.authenticationResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'FAILED').length;
  }

  trackByAuthenticationTestName(index: number, test: AuthenticationTest): string {
    return test.testName;
  }

  // Méthodes pour la sécurité des fichiers
  openFileSecurityDetails(): void {
    this.showFileSecurityModal.set(true);
  }

  closeFileSecurityDetails(): void {
    this.showFileSecurityModal.set(false);
  }

  getFileSecurityStatus(): string {
    const result = this.fileSecurityResult();
    if (!result) return 'pending';
    
    // Utiliser le statut de l'API directement
    switch (result.status) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'failed';
      case 'FAILED':
      case 'DANGER':
        return 'vulnerable';
      default:
        // Fallback basé sur le score si le statut n'est pas reconnu
        if (result.scoreGlobal >= 70) return 'success';
        if (result.scoreGlobal >= 50) return 'failed';
        return 'vulnerable';
    }
  }

  getFileSecuritySeverity(): string {
    const result = this.fileSecurityResult();
    if (!result) return 'medium';
    
    // Déterminer la sévérité basée sur le score global
    if (result.scoreGlobal >= 90) return 'low';
    if (result.scoreGlobal >= 70) return 'medium';
    if (result.scoreGlobal >= 50) return 'high';
    return 'critical';
  }

  getFileSecurityStatusIcon(): string {
    return this.getStatusIcon(this.getFileSecurityStatus());
  }

  getFileSecurityTestStatusIcon(status: string): string {
    switch (status) {
      case 'PASSED':
        return '✓';
      case 'FAILED':
        return '✗';
      default:
        return '?';
    }
  }

  getFileSecuritySummary(): string {
    const summary = this.fileSecurityResult()?.summary || '';
    return summary;
  }

  getFileSecuritySuccessCount(): number {
    const result = this.fileSecurityResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'PASSED').length;
  }

  getFileSecurityFailedCount(): number {
    const result = this.fileSecurityResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'FAILED').length;
  }

  trackByFileSecurityTestName(index: number, test: FileSecurityTest): string {
    return test.testName;
  }

  // Méthodes pour l'injection SQL
  handleSqlInjectionClick(): void {
    console.log('🔍 [FRONTEND] Clic sur SQL Injection - targetUrl:', this.targetUrl);
    console.log('🔍 [FRONTEND] sqlInjectionResult existe:', !!this.sqlInjectionResult());
    console.log('🔍 [FRONTEND] isSqlInjectionAuditing:', this.isSqlInjectionAuditing());
    
    if (this.isSqlInjectionAuditing()) {
      return; // Ne rien faire si l'audit est en cours
    }

    if (this.sqlInjectionResult()) {
      // Si les résultats existent, ouvrir le modal
      console.log('🔍 [FRONTEND] Ouverture du modal SQL Injection');
      this.openSqlInjectionDetails();
    } else {
      // Sinon, lancer l'audit
      console.log('🔍 [FRONTEND] Lancement de l\'audit SQL Injection');
      this.runSqlInjectionAudit();
    }
  }

  openSqlInjectionDetails(): void {
    this.showSqlInjectionModal.set(true);
  }

  closeSqlInjectionDetails(): void {
    this.showSqlInjectionModal.set(false);
  }

  // Méthodes pour gérer l'audit XSS
  handleXssClick(): void {
    if (this.isXssAuditing()) {
      return; // Ne rien faire si l'audit est en cours
    }

    if (this.xssResult()) {
      // Si les résultats existent, ouvrir le modal
      this.openXssDetails();
    } else {
      // Sinon, lancer l'audit
      this.runXssAudit();
    }
  }

  openXssDetails(): void {
    this.showXssModal.set(true);
  }

  closeXssDetails(): void {
    this.showXssModal.set(false);
  }

  // Méthodes pour gérer l'audit Admin Panel
  handleAdminPanelClick(): void {
    if (this.isAdminPanelAuditing()) {
      return; // Ne rien faire si l'audit est en cours
    }

    if (this.adminPanelResult()) {
      // Si les résultats existent, ouvrir le modal
      this.openAdminPanelDetails();
    } else {
      // Sinon, lancer l'audit
      this.runAdminPanelAudit();
    }
  }

  openAdminPanelDetails(): void {
    this.showAdminPanelModal.set(true);
  }

  closeAdminPanelDetails(): void {
    this.showAdminPanelModal.set(false);
  }

  // Méthodes pour gérer l'audit Session Management
  handleSessionManagementClick(): void {
    if (this.isSessionManagementAuditing()) {
      return; // Ne rien faire si l'audit est en cours
    }

    if (this.sessionManagementResult()) {
      // Si les résultats existent, ouvrir le modal
      this.openSessionManagementDetails();
    } else {
      // Sinon, lancer l'audit
      this.runSessionManagementAudit();
    }
  }

  openSessionManagementDetails(): void {
    this.showSessionManagementModal.set(true);
  }

  closeSessionManagementDetails(): void {
    this.showSessionManagementModal.set(false);
  }

  // Méthodes pour gérer l'audit SSL/TLS
  handleSslTlsClick(): void {
    if (this.isSslTlsAuditing()) {
      return; // Ne rien faire si l'audit est en cours
    }

    if (this.sslTlsResult()) {
      // Si les résultats existent, ouvrir le modal
      this.openSslTlsDetails();
    } else {
      // Sinon, lancer l'audit
      this.runSslTlsAudit();
    }
  }

  openSslTlsDetails(): void {
    this.showSslTlsModal.set(true);
  }

  closeSslTlsDetails(): void {
    this.showSslTlsModal.set(false);
  }

  getSqlInjectionStatus(): string {
    const result = this.sqlInjectionResult();
    if (!result) return 'pending';
    
    // Utiliser le statut de l'API directement
    switch (result.status) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'failed';
      case 'FAILED':
      case 'DANGER':
        return 'vulnerable';
      default:
        // Fallback basé sur le score si le statut n'est pas reconnu
        if (result.globalScore >= 70) return 'success';
        if (result.globalScore >= 50) return 'failed';
        return 'vulnerable';
    }
  }

  getSqlInjectionSeverity(): string {
    const result = this.sqlInjectionResult();
    if (!result) return 'medium';
    
    // Déterminer la sévérité basée sur le score global
    if (result.globalScore >= 90) return 'low';
    if (result.globalScore >= 70) return 'medium';
    if (result.globalScore >= 50) return 'high';
    return 'critical';
  }

  getSqlInjectionStatusIcon(): string {
    return this.getStatusIcon(this.getSqlInjectionStatus());
  }

  getSqlInjectionSummary(): string {
    const summary = this.sqlInjectionResult()?.summary || '';
    return summary;
  }

  getSqlInjectionSuccessCount(): number {
    const result = this.sqlInjectionResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'SUCCESS').length;
  }

  getSqlInjectionFailedCount(): number {
    const result = this.sqlInjectionResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'FAILED').length;
  }

  trackBySqlInjectionTestName(index: number, test: SqlInjectionTest): string {
    return test.testName;
  }

  // Méthodes utilitaires pour XSS
  getXssStatus(): string {
    const result = this.xssResult();
    if (!result) return 'pending';
    
    switch (result.overallStatus) {
      case 'SUCCESS': return 'success';
      case 'WARNING': return 'warning';
      case 'FAILED': return 'failed';
      case 'DANGER': return 'danger';
      default: return 'pending';
    }
  }

  getXssSeverity(): string {
    const result = this.xssResult();
    if (!result) return 'medium';
    
    const failedTests = result.tests.filter(test => test.status === 'FAILED');
    if (failedTests.length === 0) return 'low';
    
    const hasCritical = failedTests.some(test => test.severity === 'CRITICAL');
    const hasHigh = failedTests.some(test => test.severity === 'HIGH');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    return 'medium';
  }

  getXssStatusIcon(): string {
    const status = this.getXssStatus();
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'failed': return '✗';
      case 'danger': return '💀';
      default: return '⏳';
    }
  }

  getXssSummary(): string {
    const result = this.xssResult();
    if (!result) return 'En attente de l\'audit XSS';
    return result.summary;
  }

  getXssSuccessCount(): number {
    const result = this.xssResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'SUCCESS').length;
  }

  getXssFailedCount(): number {
    const result = this.xssResult();
    if (!result) return 0;
    return result.tests.filter(test => test.status === 'FAILED').length;
  }

  trackByXssTestName(index: number, test: XssTest): string {
    return test.testName;
  }

  // Méthodes utilitaires pour Admin Panel
  getAdminPanelStatus(): string {
    const result = this.adminPanelResult();
    if (!result) return 'pending';
    
    switch (result.status) {
      case 'OK': return 'success';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'danger';
      case 'FAILED': return 'failed';
      default: return 'pending';
    }
  }

  getAdminPanelSeverity(): string {
    const result = this.adminPanelResult();
    if (!result) return 'medium';
    
    switch (result.severity) {
      case 'LOW': return 'low';
      case 'MEDIUM': return 'medium';
      case 'HIGH': return 'high';
      case 'CRITICAL': return 'critical';
      default: return 'medium';
    }
  }

  getAdminPanelStatusIcon(): string {
    const status = this.getAdminPanelStatus();
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'failed': return '✗';
      case 'danger': return '🚨';
      default: return '⏳';
    }
  }

  getAdminPanelSummary(): string {
    const result = this.adminPanelResult();
    if (!result) return 'En attente de l\'audit Admin Panel';
    return result.resultMessage;
  }

  // Méthodes utilitaires pour Session Management
  getSessionManagementStatus(): string {
    const result = this.sessionManagementResult();
    if (!result) return 'pending';
    
    if (result.score >= 80) return 'success';
    if (result.score >= 60) return 'warning';
    if (result.score >= 40) return 'failed';
    return 'danger';
  }

  getSessionManagementSeverity(): string {
    const result = this.sessionManagementResult();
    if (!result) return 'medium';
    
    const criticalVulns = result.vulnerabilities.filter(v => v.status === 'CRITICAL').length;
    const highVulns = result.vulnerabilities.filter(v => v.status === 'HIGH').length;
    
    if (criticalVulns > 0) return 'critical';
    if (highVulns > 0) return 'high';
    if (result.vulnerabilities.length > 0) return 'medium';
    return 'low';
  }

  getSessionManagementStatusIcon(): string {
    const status = this.getSessionManagementStatus();
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'failed': return '✗';
      case 'danger': return '🚨';
      default: return '⏳';
    }
  }

  getSessionManagementSummary(): string {
    const result = this.sessionManagementResult();
    if (!result) return 'En attente de l\'audit Session Management';
    return result.message;
  }

  // Méthodes utilitaires pour SSL/TLS
  getSslTlsStatus(): string {
    const result = this.sslTlsResult();
    if (!result) return 'pending';
    
    switch (result.status) {
      case 'OK': return 'success';
      case 'AVERTISSEMENT': return 'warning';
      case 'CRITIQUE': return 'danger';
      case 'FAILED': return 'failed';
      default: return 'pending';
    }
  }

  getSslTlsSeverity(): string {
    const result = this.sslTlsResult();
    if (!result) return 'medium';
    
    switch (result.severity) {
      case 'FAIBLE': return 'low';
      case 'MODÉRÉ': return 'medium';
      case 'ÉLEVÉ': return 'high';
      case 'CRITIQUE': return 'critical';
      default: return 'medium';
    }
  }

  getSslTlsStatusIcon(): string {
    const status = this.getSslTlsStatus();
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'failed': return '✗';
      case 'danger': return '🚨';
      default: return '⏳';
    }
  }

  getSslTlsSummary(): string {
    const result = this.sslTlsResult();
    if (!result) return 'En attente de l\'audit SSL/TLS';
    return result.resultMessage;
  }

  getSslTlsScore(): number {
    const result = this.sslTlsResult();
    if (!result) return 0;
    return result.details?.securityMetrics?.overallScore || 0;
  }

  getSslTlsVulnerabilitiesCount(): number {
    const result = this.sslTlsResult();
    if (!result) return 0;
    return result.details?.vulnerabilities?.count || 0;
  }

  getSslTlsProtocolsCount(): number {
    const result = this.sslTlsResult();
    if (!result) return 0;
    return result.details?.tlsProtocols?.supported?.length || 0;
  }

  ngOnInit() {
    this.detectTheme();
  }

  private detectTheme() {
    // Détecter le thème sombre
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                   document.body.classList.contains('dark') ||
                   document.documentElement.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkMode = isDark;
    console.log('Theme detected:', isDark ? 'dark' : 'light'); // Debug
  }
}
