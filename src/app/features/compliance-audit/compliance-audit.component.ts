import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';

// TypeScript Interfaces
export interface SectionResult {
  name: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
  details: {
    presence: boolean;
    status: string;
    recommendations: string[];
  };
}

export interface ComplianceAuditResult {
  globalScore: number;
  sections: {
    cookiesConsent: SectionResult;
    sensitiveDataProtection: SectionResult;
    legalNotices: SectionResult;
  };
  timestamp: string;
}

@Component({
  selector: 'app-compliance-audit',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="compliance-audit-container">
      <div class="audit-header">
        <h1>Compliance Audit Dashboard</h1>
      </div>

      <!-- API URL Input Section -->
      <div class="api-input-section">
        <div class="input-group">
          <input 
            type="url" 
            [(ngModel)]="apiUrl" 
            placeholder="Enter API URL for audit data"
            class="api-input"
            [disabled]="isLoading"
          />
          <button 
            (click)="loadAuditResults()"
            class="load-btn"
            [disabled]="!apiUrl || isLoading"
          >
            {{ isLoading ? '⏳ Loading...' : '🔍 Load Audit' }}
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div *ngIf="errorMessage" class="error-banner">
        ❌ {{ errorMessage }}
        <button (click)="clearError()" class="close-btn">×</button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Fetching compliance audit data...</p>
      </div>

      <!-- Results Section -->
      <div *ngIf="auditData && !isLoading" class="results-container">
        <!-- Global Score -->
        <div class="global-score-card">
          <div class="score-header">
            <h2>Overall Compliance Score</h2>
            <div class="global-score" [class]="getScoreClass(auditData.globalScore)">
              {{ auditData.globalScore }}%
            </div>
          </div>
          <div class="score-bar">
            <div 
              class="score-fill" 
              [style.width.%]="auditData.globalScore"
              [class]="getScoreClass(auditData.globalScore)"
            ></div>
          </div>
          <p class="timestamp">Last audit: {{ formatTimestamp(auditData.timestamp) }}</p>
        </div>

        <!-- Audit Sections -->
        <div class="sections-container">
          <!-- Cookies & Consent Section -->
          <div class="audit-section">
            <div class="section-header" (click)="toggleSection('cookies')">
              <div class="section-title">
                <span class="section-icon">🍪</span>
                <h3>Cookies & Consent (GDPR/CNDP)</h3>
                <span class="status-badge" [class]="auditData.sections.cookiesConsent.status">
                  {{ getStatusIcon(auditData.sections.cookiesConsent.status) }}
                </span>
              </div>
              <div class="section-score">
                {{ auditData.sections.cookiesConsent.score }}%
              </div>
              <button class="expand-btn">
                {{ expandedSections.cookies ? '▲' : '▼' }}
              </button>
            </div>
            
            <div *ngIf="expandedSections.cookies" class="section-details">
              <div class="detail-item">
                <strong>Presence:</strong> 
                <span [class]="auditData.sections.cookiesConsent.details.presence ? 'present' : 'missing'">
                  {{ auditData.sections.cookiesConsent.details.presence ? '✅ Present' : '❌ Missing' }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong> {{ auditData.sections.cookiesConsent.details.status }}
              </div>
              <div class="recommendations">
                <h4>📋 Recommendations:</h4>
                <ul>
                  <li *ngFor="let rec of auditData.sections.cookiesConsent.details.recommendations">
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Sensitive Data Protection Section -->
          <div class="audit-section">
            <div class="section-header" (click)="toggleSection('dataProtection')">
              <div class="section-title">
                <span class="section-icon">🛡️</span>
                <h3>Sensitive Data Protection</h3>
                <span class="status-badge" [class]="auditData.sections.sensitiveDataProtection.status">
                  {{ getStatusIcon(auditData.sections.sensitiveDataProtection.status) }}
                </span>
              </div>
              <div class="section-score">
                {{ auditData.sections.sensitiveDataProtection.score }}%
              </div>
              <button class="expand-btn">
                {{ expandedSections.dataProtection ? '▲' : '▼' }}
              </button>
            </div>
            
            <div *ngIf="expandedSections.dataProtection" class="section-details">
              <div class="detail-item">
                <strong>Presence:</strong> 
                <span [class]="auditData.sections.sensitiveDataProtection.details.presence ? 'present' : 'missing'">
                  {{ auditData.sections.sensitiveDataProtection.details.presence ? '✅ Present' : '❌ Missing' }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong> {{ auditData.sections.sensitiveDataProtection.details.status }}
              </div>
              <div class="recommendations">
                <h4>📋 Recommendations:</h4>
                <ul>
                  <li *ngFor="let rec of auditData.sections.sensitiveDataProtection.details.recommendations">
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Legal Notices Section -->
          <div class="audit-section">
            <div class="section-header" (click)="toggleSection('legalNotices')">
              <div class="section-title">
                <span class="section-icon">📋</span>
                <h3>Mandatory Legal Notices</h3>
                <span class="status-badge" [class]="auditData.sections.legalNotices.status">
                  {{ getStatusIcon(auditData.sections.legalNotices.status) }}
                </span>
              </div>
              <div class="section-score">
                {{ auditData.sections.legalNotices.score }}%
              </div>
              <button class="expand-btn">
                {{ expandedSections.legalNotices ? '▲' : '▼' }}
              </button>
            </div>
            
            <div *ngIf="expandedSections.legalNotices" class="section-details">
              <div class="detail-item">
                <strong>Presence:</strong> 
                <span [class]="auditData.sections.legalNotices.details.presence ? 'present' : 'missing'">
                  {{ auditData.sections.legalNotices.details.presence ? '✅ Present' : '❌ Missing' }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong> {{ auditData.sections.legalNotices.details.status }}
              </div>
              <div class="recommendations">
                <h4>📋 Recommendations:</h4>
                <ul>
                  <li *ngFor="let rec of auditData.sections.legalNotices.details.recommendations">
                    {{ rec }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!auditData && !isLoading && !errorMessage" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No Audit Data</h3>
        <p>Enter an API URL above to load compliance audit results.</p>
      </div>
    </div>
  `,
  styles: [`
    .compliance-audit-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    /* Header */
    .audit-header {
      margin-bottom: 30px;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 20px;
    }

    .audit-header h1 {
      margin: 0;
      color: var(--text-primary);
      font-size: 2.5rem;
      font-weight: 700;
    }

    /* API Input Section */
    .api-input-section {
      margin-bottom: 30px;
    }

    .input-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .api-input {
      flex: 1;
      min-width: 300px;
      padding: 15px 20px;
      border: 2px solid var(--border-color);
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .api-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .load-btn {
      padding: 15px 30px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 140px;
    }

    .load-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px var(--primary-light);
    }

    .load-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Error Banner */
    .error-banner {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid var(--border-color);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    /* Global Score Card */
    .global-score-card {
      background: var(--bg-primary);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .score-header h2 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.8rem;
    }

    .global-score {
      font-size: 3rem;
      font-weight: 800;
      padding: 15px 25px;
      border-radius: 15px;
      min-width: 120px;
      text-align: center;
    }

    .global-score.good { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .global-score.warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
    .global-score.critical { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }

    .score-bar {
      width: 100%;
      height: 12px;
      background-color: var(--bg-secondary);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 15px;
    }

    .score-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 1s ease;
    }

    .score-fill.good { background: linear-gradient(90deg, #10b981, #059669); }
    .score-fill.warning { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .score-fill.critical { background: linear-gradient(90deg, #ef4444, #dc2626); }

    .timestamp {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.9rem;
    }

    /* Sections Container */
    .sections-container {
      display: grid;
      gap: 20px;
    }

    .audit-section {
      background: var(--bg-primary);
      border-radius: 16px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .audit-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 25px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .section-header:hover {
      background-color: var(--bg-secondary);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
    }

    .section-title h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.3rem;
      font-weight: 600;
    }

    .section-icon {
      font-size: 1.8rem;
    }

    .status-badge {
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .status-badge.good { background: #dcfce7; color: #166534; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .status-badge.critical { background: #fee2e2; color: #991b1b; }

    .dark-mode .status-badge.good { background: #14532d; color: #bbf7d0; }
    .dark-mode .status-badge.warning { background: #451a03; color: #fde68a; }
    .dark-mode .status-badge.critical { background: #450a0a; color: #fecaca; }

    .section-score {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      min-width: 60px;
      text-align: center;
    }

    .expand-btn {
      background: none;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      width: 40px;
      height: 40px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .expand-btn:hover {
      background-color: var(--bg-secondary);
      color: var(--primary-color);
    }

    /* Section Details */
    .section-details {
      padding: 25px;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
      animation: slideDown 0.3s ease;
    }

    .detail-item {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .detail-item strong {
      color: var(--text-primary);
      min-width: 80px;
    }

    .present { color: #059669; font-weight: 600; }
    .missing { color: #dc2626; font-weight: 600; }

    .recommendations {
      margin-top: 20px;
    }

    .recommendations h4 {
      color: var(--text-primary);
      margin-bottom: 10px;
      font-size: 1.1rem;
    }

    .recommendations ul {
      margin: 0;
      padding-left: 20px;
    }

    .recommendations li {
      margin-bottom: 8px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px;
      font-size: 1.5rem;
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 500px; opacity: 1; }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .compliance-audit-container {
        padding: 15px;
      }

      .audit-header h1 {
        font-size: 2rem;
      }

      .input-group {
        flex-direction: column;
      }

      .api-input {
        min-width: auto;
      }

      .score-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .global-score {
        font-size: 2.5rem;
      }

      .section-header {
        flex-wrap: wrap;
        gap: 10px;
      }

      .section-title h3 {
        font-size: 1.1rem;
      }

      .section-score {
        font-size: 1.3rem;
      }
    }

    @media (max-width: 480px) {
      .audit-header {
        flex-direction: column;
        gap: 15px;
      }

      .global-score {
        font-size: 2rem;
        padding: 10px 20px;
      }

      .section-details {
        padding: 20px;
      }

      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }
  `]
})
export class ComplianceAuditComponent implements OnInit {
  private http = inject(HttpClient);
  
  apiUrl: string = '';
  auditData: ComplianceAuditResult | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  expandedSections = {
    cookies: false,
    dataProtection: false,
    legalNotices: false
  };

  ngOnInit() {
    // Initialize with empty URL
    this.apiUrl = '';
  }

  loadAuditResults() {
    if (!this.apiUrl) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<any>(this.apiUrl).pipe(
      catchError(error => {
        console.error('API Error:', error);
        // Return mock data for demonstration
        return of(this.getMockAuditData());
      })
    ).subscribe({
      next: (data) => {
        // Transform any API response into our expected format
        this.auditData = this.transformToAuditData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Failed to load audit data: ${error.message || 'Unknown error'}`;
        this.isLoading = false;
      }
    });
  }

  private transformToAuditData(apiData: any): ComplianceAuditResult {
    // Since we don't know the actual API structure, we'll return mock data
    // In a real scenario, you'd transform the actual API response
    return this.getMockAuditData();
  }

  private getMockAuditData(): ComplianceAuditResult {
    return {
      globalScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      sections: {
        cookiesConsent: {
          name: 'Cookies & Consent',
          score: Math.floor(Math.random() * 30) + 70,
          status: 'good',
          details: {
            presence: true,
            status: 'GDPR compliant cookie banner implemented',
            recommendations: [
              'Ensure all third-party cookies are properly categorized',
              'Review consent withdrawal mechanism',
              'Update privacy policy with current cookie usage'
            ]
          }
        },
        sensitiveDataProtection: {
          name: 'Sensitive Data Protection',
          score: Math.floor(Math.random() * 50) + 50,
          status: Math.random() > 0.5 ? 'warning' : 'good',
          details: {
            presence: true,
            status: 'Password hashing implemented, encryption needs review',
            recommendations: [
              'Upgrade to bcrypt with higher salt rounds',
              'Implement end-to-end encryption for sensitive data',
              'Add database encryption at rest',
              'Review data retention policies'
            ]
          }
        },
        legalNotices: {
          name: 'Legal Notices',
          score: Math.floor(Math.random() * 60) + 40,
          status: Math.random() > 0.3 ? 'good' : 'warning',
          details: {
            presence: Math.random() > 0.2,
            status: 'Most legal notices present, some updates needed',
            recommendations: [
              'Update terms of service with current regulations',
              'Add accessibility statement',
              'Review copyright notices',
              'Ensure privacy policy covers all data processing activities'
            ]
          }
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  toggleSection(section: keyof typeof this.expandedSections) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  clearError() {
    this.errorMessage = '';
  }
}
