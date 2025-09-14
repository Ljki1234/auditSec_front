import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface AuditResult {
  id: string;
  title: string;
  icon: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
  summary: string;
  details: string[];
  // Propriété optionnelle pour l'ID de l'audit SEO
  seoAuditId?: number;
}

interface AuditHistory {
  url: string;
  date: Date;
  overallScore: number;
  // Ajouter les résultats complets pour pouvoir les restaurer
  auditResults?: AuditResult[];
}

// Interface pour stocker les résultats d'audit complets avec l'URL
interface CachedAuditData {
  url: string;
  timestamp: number;
  results: AuditResult[];
  overallScore: number;
  seoAuditId?: number;
}

@Component({
  selector: 'app-audits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audits-page">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1 class="page-title">
            Audit de Sécurité des Sites Web
          </h1>
          <p class="page-subtitle">
            Analyse complète de sécurité et de performance pour votre site web
          </p>
        </div>

        <!-- URL Input Section -->
        <div class="input-section">
          <div class="url-input-container">
            <div class="input-group">
              <label for="url" class="input-label">
                URL du Site Web
              </label>
              <input
                type="url"
                id="url"
                [(ngModel)]="currentUrl"
                placeholder="https://exemple.com"
                class="url-input"
              />
            </div>
            <div class="button-group">
              <button
                (click)="runAudit()"
                [disabled]="isLoading()"
                class="btn btn-primary audit-btn"
              >
                @if (isLoading()) {
                  <div class="spinner"></div>
                  <span>Audit en cours...</span>
                } @else {
                  <span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" style="width: 1rem; height: 1rem; margin-right: 0.5rem; vertical-align: middle;">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </span>
                  <span>Lancer l'Audit</span>
                }
              </button>
            </div>
          </div>

          <!-- Recent Audits -->
          @if (auditHistory().length > 0) {
            <div class="recent-audits">
              <h3 class="recent-title">Audits Récents</h3>
              <div class="audit-history">
                @for (audit of auditHistory(); track audit.url) {
                  <button
                    (click)="loadHistoryAudit(audit)"
                    class="history-btn"
                  >
                    {{ audit.url }} - {{ audit.overallScore }}/100
                  </button>
                }
              </div>
            </div>
          }
          

        </div>

        @if (showResults()) {
          <!-- Global Summary Section -->
          <div class="summary-section">
            <div class="summary-content">
              <h2 class="summary-title">Résumé de l'Audit</h2>
              
              <div class="summary-grid">
                <!-- Overall Score Circle -->
                <div class="score-circle-container">
                  <div class="score-circle">
                    <svg class="score-svg" viewBox="0 0 36 36">
                      <!-- Background circle -->
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="score-bg"
                      />
                      <!-- Progress circle -->
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="overallScore() + ', 100'"
                        [class]="getScoreColor(overallScore())"
                        class="score-progress"
                      />
                    </svg>
                    <div class="score-text">
                      <div class="score-number">
                        {{ overallScore() }}
                      </div>
                      <div class="score-total">
                        /100
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Status Summary -->
                <div class="status-summary">
                  <div class="status-text" [class]="getStatusTextColor(overallScore())">
                    {{ getStatusText(overallScore()) }}
                  </div>
                  <div class="status-counts">
                    <div class="status-item">
                      <div class="status-number good">
                        {{ getStatusCounts().good }}
                      </div>
                                          <div class="status-label">Bon</div>
                  </div>
                  <div class="status-item">
                    <div class="status-number warning">
                      {{ getStatusCounts().warning }}
                    </div>
                    <div class="status-label">Attention</div>
                  </div>
                  <div class="status-item">
                    <div class="status-number critical">
                      {{ getStatusCounts().critical }}
                    </div>
                    <div class="status-label">Critique</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Results Section -->
          <div class="results-grid">
            @for (result of auditResults(); track result.id; let i = $index) {
              <div 
                class="result-card animate-fade-in"
                [style.animation-delay.ms]="i * 100"
              >
                <!-- Card Header -->
                <div class="card-header">
                  <div class="card-title">
                    <div class="card-icon" [style.color]="getCardColor(result)" *ngIf="result.id !== 'ssl' && result.id !== 'headers' && result.id !== 'js-libraries' && result.id !== 'web-vulnerabilities' && result.id !== 'cookies' && result.id !== 'dependencies' && result.id !== 'backend-scan' && result.id !== 'seo'; else customIconTemplate">{{ result.icon }}</div>
                    <ng-template #customIconTemplate>
                      <div class="card-icon" [style.color]="getCardColor(result)">
                      <svg *ngIf="result.id === 'ssl'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="ssl-icon" [attr.fill]="getCardColor(result)">
                        <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                      </svg>
                      <svg *ngIf="result.id === 'headers'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="headers-icon" [attr.fill]="getCardColor(result)">
                        <path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/>
                      </svg>
                      <svg *ngIf="result.id === 'js-libraries'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="js-libraries-icon" [attr.fill]="getCardColor(result)">
                        <path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/>
                      </svg>
                      <svg *ngIf="result.id === 'web-vulnerabilities'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="vulnerabilities-icon" [attr.fill]="getCardColor(result)">
                        <path d="M525.2 82.9C536.7 88 544 99.4 544 112L544 528C544 540.6 536.7 552 525.2 557.1C513.7 562.2 500.4 560.3 490.9 552L444.3 511.3C400.7 473.2 345.6 451 287.9 448.3L287.9 544C287.9 561.7 273.6 576 255.9 576L223.9 576C206.2 576 191.9 561.7 191.9 544L191.9 448C121.3 448 64 390.7 64 320C64 249.3 121.3 192 192 192L276.5 192C338.3 191.8 397.9 169.3 444.4 128.7L491 88C500.4 79.7 513.9 77.8 525.3 82.9zM288 384L288 384.2C358.3 386.9 425.8 412.7 480 457.6L480 182.3C425.8 227.2 358.3 253 288 255.7L288 384z"/>
                      </svg>
                      <svg *ngIf="result.id === 'cookies'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="cookies-icon" [attr.fill]="getCardColor(result)">
                        <path d="M311.2 81C289.1 77.9 266.6 81.9 246.8 92.4L172.8 131.9C153.1 142.4 137.2 158.9 127.4 179L90.7 254.6C80.9 274.7 77.7 297.5 81.6 319.5L96.1 402.3C100 424.4 110.7 444.6 126.8 460.2L187.1 518.6C203.2 534.2 223.7 544.2 245.8 547.3L328.8 559C350.9 562.1 373.4 558.1 393.2 547.6L467.2 508.1C486.9 497.6 502.8 481.1 512.6 460.9L549.3 385.4C559.1 365.3 562.3 342.5 558.4 320.5L543.8 237.7C539.9 215.6 529.2 195.4 513.1 179.8L452.9 121.5C436.8 105.9 416.3 95.9 394.2 92.8L311.2 81zM272 208C289.7 208 304 222.3 304 240C304 257.7 289.7 272 272 272C254.3 272 240 257.7 240 240C240 222.3 254.3 208 272 208zM208 400C208 382.3 222.3 368 240 368C257.7 368 272 382.3 272 400C272 417.7 257.7 432 240 432C222.3 432 208 417.7 208 400zM432 336C449.7 336 464 350.3 464 368C464 385.7 449.7 400 432 400C414.3 400 400 385.7 400 368C400 350.3 414.3 336 432 336z"/>
                      </svg>
                      <svg *ngIf="result.id === 'dependencies'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="dependencies-icon" [attr.fill]="getCardColor(result)">
                        <path d="M296.5 69.2C311.4 62.3 328.6 62.3 343.5 69.2L562.1 170.2C570.6 174.1 576 182.6 576 192C576 201.4 570.6 209.9 562.1 213.8L343.5 314.8C328.6 321.7 311.4 321.7 296.5 314.8L77.9 213.8C69.4 209.8 64 201.3 64 192C64 182.7 69.4 174.1 77.9 170.2L296.5 69.2zM112.1 282.4L276.4 358.3C304.1 371.1 336 371.1 363.7 358.3L528 282.4L562.1 298.2C570.6 302.1 576 310.6 576 320C576 329.4 570.6 337.9 562.1 341.8L343.5 442.8C328.6 449.7 311.4 449.7 296.5 442.8L77.9 341.8C69.4 337.8 64 329.3 64 320C64 310.7 69.4 302.1 77.9 298.2L112 282.4zM77.9 426.2L112 410.4L276.3 486.3C304 499.1 335.9 499.1 363.6 486.3L527.9 410.4L562 426.2C570.5 430.1 575.9 438.6 575.9 448C575.9 457.4 570.5 465.9 562 469.8L343.4 570.8C328.5 577.7 311.3 577.7 296.4 570.8L77.9 469.8C69.4 465.8 64 457.3 64 448C64 438.7 69.4 430.1 77.9 426.2z"/>
                      </svg>
                      <svg *ngIf="result.id === 'backend-scan'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="backend-icon" [attr.fill]="getCardColor(result)">
                        <path d="M415.9 274.5C428.1 271.2 440.9 277 446.4 288.3L465 325.9C475.3 327.3 485.4 330.1 494.9 334L529.9 310.7C540.4 303.7 554.3 305.1 563.2 314L582.4 333.2C591.3 342.1 592.7 356.1 585.7 366.5L562.4 401.4C564.3 406.1 566 411 567.4 416.1C568.8 421.2 569.7 426.2 570.4 431.3L608.1 449.9C619.4 455.5 625.2 468.3 621.9 480.4L614.9 506.6C611.6 518.7 600.3 526.9 587.7 526.1L545.7 523.4C539.4 531.5 532.1 539 523.8 545.4L526.5 587.3C527.3 599.9 519.1 611.3 507 614.5L480.8 621.5C468.6 624.8 455.9 619 450.3 607.7L431.7 570.1C421.4 568.7 411.3 565.9 401.8 562L366.8 585.3C356.3 592.3 342.4 590.9 333.5 582L314.3 562.8C305.4 553.9 304 540 311 529.5L334.3 494.5C332.4 489.8 330.7 484.9 329.3 479.8C327.9 474.7 327 469.6 326.3 464.6L288.6 446C277.3 440.4 271.6 427.6 274.8 415.5L281.8 389.3C285.1 377.2 296.4 369 309 369.8L350.9 372.5C357.2 364.4 364.5 356.9 372.8 350.5L370.1 308.7C369.3 296.1 377.5 284.7 389.6 281.5L415.8 274.5zM448.4 404C424.1 404 404.4 423.7 404.5 448.1C404.5 472.4 424.2 492 448.5 492C472.8 492 492.5 472.3 492.5 448C492.4 423.6 472.7 404 448.4 404zM224.9 18.5L251.1 25.5C263.2 28.8 271.4 40.2 270.6 52.7L267.9 94.5C276.2 100.9 283.5 108.3 289.8 116.5L331.8 113.8C344.3 113 355.7 121.2 359 133.3L366 159.5C369.2 171.6 363.5 184.4 352.2 190L314.5 208.6C313.8 213.7 312.8 218.8 311.5 223.8C310.2 228.8 308.4 233.8 306.5 238.5L329.8 273.5C336.8 284 335.4 297.9 326.5 306.8L307.3 326C298.4 334.9 284.5 336.3 274 329.3L239 306C229.5 309.9 219.4 312.7 209.1 314.1L190.5 351.7C184.9 363 172.1 368.7 160 365.5L133.8 358.5C121.6 355.2 113.5 343.8 114.3 331.3L117 289.4C108.7 283 101.4 275.6 95.1 267.4L53.1 270.1C40.6 270.9 29.2 262.7 25.9 250.6L18.9 224.4C15.7 212.3 21.4 199.5 32.7 193.9L70.4 175.3C71.1 170.2 72.1 165.2 73.4 160.1C74.8 155 76.4 150.1 78.4 145.4L55.1 110.5C48.1 100 49.5 86.1 58.4 77.2L77.6 58C86.5 49.1 100.4 47.7 110.9 54.7L145.9 78C155.4 74.1 165.5 71.3 175.8 69.9L194.4 32.3C200 21 212.7 15.3 224.9 18.5zM192.4 148C168.1 148 148.4 167.7 148.4 192C148.4 216.3 168.1 236 192.4 236C216.7 236 236.4 216.3 236.4 192C236.4 167.7 216.7 148 192.4 148z"/>
                      </svg>
                      <svg *ngIf="result.id === 'seo'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="seo-icon" [attr.fill]="getCardColor(result)">
                        <path d="M256 144C256 117.5 277.5 96 304 96L336 96C362.5 96 384 117.5 384 144L384 496C384 522.5 362.5 544 336 544L304 544C277.5 544 256 522.5 256 496L256 144zM64 336C64 309.5 85.5 288 112 288L144 288C170.5 288 192 309.5 192 336L192 496C192 522.5 170.5 544 144 544L112 544C85.5 544 64 522.5 64 496L64 336zM496 160L528 160C554.5 160 576 181.5 576 208L576 496C576 522.5 554.5 544 528 544L496 544C469.5 544 448 522.5 448 496L448 208C448 181.5 469.5 160 496 160z"/>
                      </svg>
                      </div>
                    </ng-template>
                    <h3 class="card-name">
                      {{ result.title }}
                    </h3>
                  </div>
                  <div [class]="getStatusBadgeClass(result.status)" class="status-badge">
                    {{ getStatusIcon(result.status) }} {{ result.status | titlecase }}
                  </div>
                </div>

                <!-- Score Progress Bar -->
                <div class="score-section">
                  <div class="score-header">
                    <span class="score-label">Score</span>
                    <span class="score-value">{{ result.score }}/100</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      [class]="getScoreBarColor(result.score)"
                      class="progress-fill"
                      [style.width.%]="result.score"
                      [style.animation-delay.ms]="i * 150"
                    ></div>
                  </div>
                </div>

                <!-- Summary -->
                <p class="card-summary">
                  {{ result.summary }}
                </p>

                <!-- View Details Button -->
                @if ((result.id === 'web-vulnerabilities' && isVulnScanLoading()) || (result.id === 'seo' && isSeoAuditLoading()) || (result.id === 'cookies' && isCookieAuditLoading()) || (result.id === 'dependencies' && isDependencyAuditLoading()) || (result.id === 'backend-scan' && isBackendLibrariesLoading())) {
                  <div class="loading-container">
                    <div class="spinner"></div>
                    <span class="loading-text">
                      @if (result.id === 'web-vulnerabilities') {
                        Veuillez patienter un peu...
                      } @else if (result.id === 'seo') {
                        Récupération des détails SEO...
                      } @else if (result.id === 'cookies') {
                        Analyse des cookies et sessions...
                      } @else if (result.id === 'dependencies') {
                        Analyse des dépendances en cours...
                      } @else if (result.id === 'backend-scan') {
                        Analyse des bibliothèques backend en cours...
                      } @else {
                        Veuillez patienter un peu...
                      }
                    </span>
                  </div>
                } @else {
                  <button
                    (click)="viewDetails(result)"
                    class="btn btn-secondary details-btn"
                    [disabled]="(result.id === 'web-vulnerabilities' && isVulnScanLoading()) || (result.id === 'seo' && isSeoAuditLoading()) || (result.id === 'cookies' && isCookieAuditLoading()) || (result.id === 'dependencies' && isDependencyAuditLoading()) || (result.id === 'backend-scan' && isBackendLibrariesLoading())"
                    [class.btn-disabled]="(result.id === 'web-vulnerabilities' && isVulnScanLoading()) || (result.id === 'seo' && isSeoAuditLoading()) || (result.id === 'cookies' && isCookieAuditLoading()) || (result.id === 'dependencies' && isDependencyAuditLoading()) || (result.id === 'backend-scan' && isBackendLibrariesLoading())"
                  >
                    Voir les Détails
                  </button>
                }
              </div>
            }
          </div>
        }

        @if (!showResults() && !isLoading()) {
                  <div class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
              <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
            </svg>
          </div>
          <h2 class="empty-title">Prêt pour l'Audit</h2>
          <p class="empty-text">Entrez une URL de site web ci-dessus pour commencer l'audit de sécurité</p>
        </div>
        }
      </div>
    </div>
    
    <!-- Modal pour les détails -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-icon" [style.color]="getModalIconColor(selectedResult())">
                <div *ngIf="selectedResult()?.id !== 'ssl' && selectedResult()?.id !== 'headers' && selectedResult()?.id !== 'js-libraries' && selectedResult()?.id !== 'web-vulnerabilities' && selectedResult()?.id !== 'cookies' && selectedResult()?.id !== 'dependencies' && selectedResult()?.id !== 'backend-scan' && selectedResult()?.id !== 'seo'; else modalCustomIconTemplate">{{ selectedResult()?.icon }}</div>
                <ng-template #modalCustomIconTemplate>
                  <svg *ngIf="selectedResult()?.id === 'ssl'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="ssl-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'headers'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="headers-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'js-libraries'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="js-libraries-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'web-vulnerabilities'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="vulnerabilities-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M525.2 82.9C536.7 88 544 99.4 544 112L544 528C544 540.6 536.7 552 525.2 557.1C513.7 562.2 500.4 560.3 490.9 552L444.3 511.3C400.7 473.2 345.6 451 287.9 448.3L287.9 544C287.9 561.7 273.6 576 255.9 576L223.9 576C206.2 576 191.9 561.7 191.9 544L191.9 448C121.3 448 64 390.7 64 320C64 249.3 121.3 192 192 192L276.5 192C338.3 191.8 397.9 169.3 444.4 128.7L491 88C500.4 79.7 513.9 77.8 525.3 82.9zM288 384L288 384.2C358.3 386.9 425.8 412.7 480 457.6L480 182.3C425.8 227.2 358.3 253 288 255.7L288 384z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'cookies'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="cookies-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M311.2 81C289.1 77.9 266.6 81.9 246.8 92.4L172.8 131.9C153.1 142.4 137.2 158.9 127.4 179L90.7 254.6C80.9 274.7 77.7 297.5 81.6 319.5L96.1 402.3C100 424.4 110.7 444.6 126.8 460.2L187.1 518.6C203.2 534.2 223.7 544.2 245.8 547.3L328.8 559C350.9 562.1 373.4 558.1 393.2 547.6L467.2 508.1C486.9 497.6 502.8 481.1 512.6 460.9L549.3 385.4C559.1 365.3 562.3 342.5 558.4 320.5L543.8 237.7C539.9 215.6 529.2 195.4 513.1 179.8L452.9 121.5C436.8 105.9 416.3 95.9 394.2 92.8L311.2 81zM272 208C289.7 208 304 222.3 304 240C304 257.7 289.7 272 272 272C254.3 272 240 257.7 240 240C240 222.3 254.3 208 272 208zM208 400C208 382.3 222.3 368 240 368C257.7 368 272 382.3 272 400C272 417.7 257.7 432 240 432C222.3 432 208 417.7 208 400zM432 336C449.7 336 464 350.3 464 368C464 385.7 449.7 400 432 400C414.3 400 400 385.7 400 368C400 350.3 414.3 336 432 336z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'dependencies'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="dependencies-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M296.5 69.2C311.4 62.3 328.6 62.3 343.5 69.2L562.1 170.2C570.6 174.1 576 182.6 576 192C576 201.4 570.6 209.9 562.1 213.8L343.5 314.8C328.6 321.7 311.4 321.7 296.5 314.8L77.9 213.8C69.4 209.8 64 201.3 64 192C64 182.7 69.4 174.1 77.9 170.2L296.5 69.2zM112.1 282.4L276.4 358.3C304.1 371.1 336 371.1 363.7 358.3L528 282.4L562.1 298.2C570.6 302.1 576 310.6 576 320C576 329.4 570.6 337.9 562.1 341.8L343.5 442.8C328.6 449.7 311.4 449.7 296.5 442.8L77.9 341.8C69.4 337.8 64 329.3 64 320C64 310.7 69.4 302.1 77.9 298.2L112 282.4zM77.9 426.2L112 410.4L276.3 486.3C304 499.1 335.9 499.1 363.6 486.3L527.9 410.4L562 426.2C570.5 430.1 575.9 438.6 575.9 448C575.9 457.4 570.5 465.9 562 469.8L343.4 570.8C328.5 577.7 311.3 577.7 296.4 570.8L77.9 469.8C69.4 465.8 64 457.3 64 448C64 438.7 69.4 430.1 77.9 426.2z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'backend-scan'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="backend-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M415.9 274.5C428.1 271.2 440.9 277 446.4 288.3L465 325.9C475.3 327.3 485.4 330.1 494.9 334L529.9 310.7C540.4 303.7 554.3 305.1 563.2 314L582.4 333.2C591.3 342.1 592.7 356.1 585.7 366.5L562.4 401.4C564.3 406.1 566 411 567.4 416.1C568.8 421.2 569.7 426.2 570.4 431.3L608.1 449.9C619.4 455.5 625.2 468.3 621.9 480.4L614.9 506.6C611.6 518.7 600.3 526.9 587.7 526.1L545.7 523.4C539.4 531.5 532.1 539 523.8 545.4L526.5 587.3C527.3 599.9 519.1 611.3 507 614.5L480.8 621.5C468.6 624.8 455.9 619 450.3 607.7L431.7 570.1C421.4 568.7 411.3 565.9 401.8 562L366.8 585.3C356.3 592.3 342.4 590.9 333.5 582L314.3 562.8C305.4 553.9 304 540 311 529.5L334.3 494.5C332.4 489.8 330.7 484.9 329.3 479.8C327.9 474.7 327 469.6 326.3 464.6L288.6 446C277.3 440.4 271.6 427.6 274.8 415.5L281.8 389.3C285.1 377.2 296.4 369 309 369.8L350.9 372.5C357.2 364.4 364.5 356.9 372.8 350.5L370.1 308.7C369.3 296.1 377.5 284.7 389.6 281.5L415.8 274.5zM448.4 404C424.1 404 404.4 423.7 404.5 448.1C404.5 472.4 424.2 492 448.5 492C472.8 492 492.5 472.3 492.5 448C492.4 423.6 472.7 404 448.4 404zM224.9 18.5L251.1 25.5C263.2 28.8 271.4 40.2 270.6 52.7L267.9 94.5C276.2 100.9 283.5 108.3 289.8 116.5L331.8 113.8C344.3 113 355.7 121.2 359 133.3L366 159.5C369.2 171.6 363.5 184.4 352.2 190L314.5 208.6C313.8 213.7 312.8 218.8 311.5 223.8C310.2 228.8 308.4 233.8 306.5 238.5L329.8 273.5C336.8 284 335.4 297.9 326.5 306.8L307.3 326C298.4 334.9 284.5 336.3 274 329.3L239 306C229.5 309.9 219.4 312.7 209.1 314.1L190.5 351.7C184.9 363 172.1 368.7 160 365.5L133.8 358.5C121.6 355.2 113.5 343.8 114.3 331.3L117 289.4C108.7 283 101.4 275.6 95.1 267.4L53.1 270.1C40.6 270.9 29.2 262.7 25.9 250.6L18.9 224.4C15.7 212.3 21.4 199.5 32.7 193.9L70.4 175.3C71.1 170.2 72.1 165.2 73.4 160.1C74.8 155 76.4 150.1 78.4 145.4L55.1 110.5C48.1 100 49.5 86.1 58.4 77.2L77.6 58C86.5 49.1 100.4 47.7 110.9 54.7L145.9 78C155.4 74.1 165.5 71.3 175.8 69.9L194.4 32.3C200 21 212.7 15.3 224.9 18.5zM192.4 148C168.1 148 148.4 167.7 148.4 192C148.4 216.3 168.1 236 192.4 236C216.7 236 236.4 216.3 236.4 192C236.4 167.7 216.7 148 192.4 148z"/>
                  </svg>
                  <svg *ngIf="selectedResult()?.id === 'seo'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="seo-icon" [attr.fill]="getModalIconColor(selectedResult())">
                    <path d="M256 144C256 117.5 277.5 96 304 96L336 96C362.5 96 384 117.5 384 144L384 496C384 522.5 362.5 544 336 544L304 544C277.5 544 256 522.5 256 496L256 144zM64 336C64 309.5 85.5 288 112 288L144 288C170.5 288 192 309.5 192 336L192 496C192 522.5 170.5 544 144 544L112 544C85.5 544 64 522.5 64 496L64 336zM496 160L528 160C554.5 160 576 181.5 576 208L576 496C576 522.5 554.5 544 528 544L496 544C469.5 544 448 522.5 448 496L448 208C448 181.5 469.5 160 496 160z"/>
                  </svg>
                </ng-template>
              </div>
              <h3>{{ selectedResult()?.title }}</h3>
            </div>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="modal-score-section">
              <div class="modal-score-display">
                <span class="modal-score-number">{{ selectedResult()?.score }}</span>
                <span class="modal-score-max">/100</span>
              </div>
              <div class="modal-status-badge" [class]="getStatusBadgeClass(selectedResult()?.status || '')">
                {{ getStatusIcon(selectedResult()?.status || '') }} {{ selectedResult()?.status | titlecase }}
              </div>
            </div>
            
            <div class="modal-summary">
              <p>{{ selectedResult()?.summary }}</p>
            </div>
            
            <div class="modal-details">
              <h4>Détails de l'audit :</h4>
              <ul class="details-list">
                @for (detail of selectedResult()?.details; track $index) {
                  <li class="detail-item">{{ detail }}</li>
                }
              </ul>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-primary" (click)="closeModal()">Fermer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .audits-page {
      min-height: 100vh;
      background-color: var(--bg-secondary);
      transition: background-color 0.3s ease;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Header */
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 1.125rem;
      margin: 0;
    }

    /* Input Section */
    .input-section {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }

    .url-input-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .url-input-container {
        flex-direction: row;
        align-items: end;
      }
    }

    .input-group {
      flex: 1;
    }

    .input-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .url-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .url-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .button-group {
      display: flex;
      align-items: end;
    }

    .audit-btn {
      min-width: 140px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: center;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Recent Audits */
    .recent-audits {
      margin-top: 1.5rem;
    }

    .recent-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
    }

    .audit-history {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .history-btn {
      padding: 0.5rem 0.75rem;
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .history-btn:hover {
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
    }

    /* Summary Section */
    .summary-section {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      margin-bottom: 2rem;
    }

    .summary-content {
      text-align: center;
    }

    .summary-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
    }

    .summary-grid {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .summary-grid {
        flex-direction: row;
      }
    }

    /* Score Circle */
    .score-circle-container {
      position: relative;
    }

    .score-circle {
      width: 128px;
      height: 128px;
      position: relative;
    }

    .score-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .score-bg {
      color: var(--bg-tertiary);
    }

    .score-progress {
      transition: all 1s ease-out;
    }

    .score-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .score-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .score-total {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Status Summary */
    .status-summary {
      text-align: center;
    }

    @media (min-width: 768px) {
      .status-summary {
        text-align: left;
      }
    }

    .status-text {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .status-counts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .status-item {
      text-align: center;
    }

    .status-number {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .status-number.good {
      color: var(--success-color);
    }

    .status-number.warning {
      color: var(--warning-color);
    }

    .status-number.critical {
      color: var(--error-color);
    }

    .status-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Results Grid */
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .result-card {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }

    .result-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
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
    
    .ssl-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .headers-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .js-libraries-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .vulnerabilities-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .cookies-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .dependencies-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .backend-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    
    .seo-icon {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    /* Mode sombre : toutes les icônes SVG spécifiques */
    [data-theme="dark"] .ssl-icon,
    [data-theme="dark"] .headers-icon,
    [data-theme="dark"] .js-libraries-icon,
    [data-theme="dark"] .vulnerabilities-icon,
    [data-theme="dark"] .cookies-icon,
    [data-theme="dark"] .dependencies-icon,
    [data-theme="dark"] .backend-icon,
    [data-theme="dark"] .seo-icon {
      fill: #111827 !important;
    }

    [data-theme="dark"] .ssl-icon path,
    [data-theme="dark"] .headers-icon path,
    [data-theme="dark"] .js-libraries-icon path,
    [data-theme="dark"] .vulnerabilities-icon path,
    [data-theme="dark"] .cookies-icon path,
    [data-theme="dark"] .dependencies-icon path,
    [data-theme="dark"] .backend-icon path,
    [data-theme="dark"] .seo-icon path {
      fill: #111827 !important;
    }

    /* Force la couleur sur tous les SVG en mode sombre */
    [data-theme="dark"] svg {
      fill: #111827 !important;
    }

    [data-theme="dark"] svg path {
      fill: #111827 !important;
    }

    [data-theme="dark"] svg * {
      fill: #111827 !important;
    }

    .card-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Score Section */
    .score-section {
      margin-bottom: 1rem;
    }

    .score-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .score-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .score-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 1s ease-out;
    }

    .progress-success {
      background-color: var(--success-color);
    }

    .progress-warning {
      background-color: var(--warning-color);
    }

    .progress-danger {
      background-color: var(--error-color);
    }

    .card-summary {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .details-btn {
      width: 100%;
      font-size: 0.875rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-icon svg {
      width: 3rem;
      height: 3rem;
      fill: currentColor;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-text {
      color: var(--text-secondary);
      margin: 0;
    }

    /* Animations */
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.6s ease-out forwards;
      opacity: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .results-grid {
        grid-template-columns: 1fr;
      }

      .status-counts {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    /* Modal Styles - Design Professionnel */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 1rem;
    }
    
    .modal-content {
      background: linear-gradient(145deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      border-radius: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      max-width: 650px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    
    .modal-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    }
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2rem 2rem 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: 1.5rem 1.5rem 0 0;
      position: relative;
    }
    
    .modal-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color));
      border-radius: 2px;
    }
    
    .modal-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .modal-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      animation: iconFloat 3s ease-in-out infinite;
    }

    .modal-icon svg {
      width: 2.5rem;
      height: 2.5rem;
      fill: currentColor;
    }

    /* Les couleurs des icônes du modal sont maintenant gérées par getModalIconColor() */
    
    .modal-title h3 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      letter-spacing: -0.025em;
    }
    
    .modal-close {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.75rem;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }
    
    .modal-close:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      color: var(--text-primary);
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
    
    .modal-body {
      padding: 2rem;
    }
    
    .modal-score-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .modal-score-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color), var(--warning-color));
      opacity: 0.8;
    }
    
    .modal-score-display {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      position: relative;
    }
    
    .modal-score-number {
      font-size: 3.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary-color), var(--success-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }
    
    .modal-score-max {
      font-size: 1.5rem;
      color: var(--text-secondary);
      font-weight: 500;
      opacity: 0.8;
    }
    
    .modal-status-badge {
      padding: 0.75rem 1.5rem;
      border-radius: 2rem;
      font-size: 0.875rem;
      font-weight: 600;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .modal-status-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .modal-summary {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }
    
    .modal-summary::before {
      content: '📋';
      position: absolute;
      top: -10px;
      left: 20px;
      background: var(--bg-primary);
      padding: 0 0.5rem;
      font-size: 0.875rem;
      border-radius: 0.5rem;
      color: var(--text-secondary);
    }
    
    .modal-summary p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.7;
      font-size: 1.1rem;
      font-weight: 500;
      text-align: center;
    }
    
    .modal-details h4 {
      margin: 0 0 1.5rem 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 700;
      text-align: center;
      position: relative;
      padding-bottom: 0.75rem;
    }
    
    .modal-details h4::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color));
      border-radius: 1px;
    }
    
    .details-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 1rem;
    }
    
    .detail-item {
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border-radius: 0.75rem;
      color: var(--text-primary);
      border-left: 4px solid var(--primary-color);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .detail-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }
    
    .detail-item:hover {
      transform: translateX(8px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-left-color: var(--success-color);
    }
    
    .detail-item:hover::before {
      transform: translateX(100%);
    }
    
    .modal-footer {
      padding: 1.5rem 2rem 2rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
      border-radius: 0 0 1.5rem 1.5rem;
    }
    
    .modal-footer .btn {
      padding: 0.875rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 2rem;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--success-color) 100%);
      border: none;
      color: white;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      position: relative;
      overflow: hidden;
    }
    
    .modal-footer .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s ease;
    }
    
    .modal-footer .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    
    .modal-footer .btn:hover::before {
      left: 100%;
    }
    
    /* Modal Animations Avancées */
    @keyframes fadeIn {
      from { 
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to { 
        opacity: 1;
        backdrop-filter: blur(8px);
      }
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-30px) scale(0.9) rotateX(10deg);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1) rotateX(0deg);
      }
    }

    /* Mode sombre pour le modal */
    [data-theme="dark"] .modal-content {
      background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    [data-theme="dark"] .modal-header {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    [data-theme="dark"] .modal-title h3 {
      color: #ffffff;
    }

    [data-theme="dark"] .modal-close {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    [data-theme="dark"] .modal-close:hover {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
      color: #ffffff;
    }

    [data-theme="dark"] .modal-score-section {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    [data-theme="dark"] .detail-item {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    [data-theme="dark"] .modal-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
    }
    
    @keyframes iconFloat {
      0%, 100% { 
        transform: translateY(0px) rotate(0deg);
      }
      50% { 
        transform: translateY(-8px) rotate(5deg);
      }
    }
    
    @keyframes scorePulse {
      0%, 100% { 
        transform: scale(1);
      }
      50% { 
        transform: scale(1.05);
      }
    }
    
    .modal-score-number {
      animation: scorePulse 2s ease-in-out infinite;
    }
    
    /* Modal Responsive et Améliorations */
    @media (max-width: 640px) {
      .modal-overlay {
        padding: 0.5rem;
      }
      
      .modal-content {
        width: 100%;
        margin: 0;
        border-radius: 1rem;
        max-height: 90vh;
      }
      
      .modal-header {
        padding: 1.5rem 1.5rem 1rem 1.5rem;
        border-radius: 1rem 1rem 0 0;
      }
      
      .modal-header::after {
        width: 40px;
        height: 2px;
      }
      
      .modal-title h3 {
        font-size: 1.5rem;
      }
      
      .modal-icon {
        font-size: 2rem;
      }
      
      .modal-body {
        padding: 1.5rem;
      }
      
      .modal-score-section {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
        padding: 1.25rem;
      }
      
      .modal-score-number {
        font-size: 3rem;
      }
      
      .modal-footer {
        padding: 1.25rem 1.5rem 1.5rem 1.5rem;
        border-radius: 0 0 1rem 1rem;
      }
      
      .modal-footer .btn {
        width: 100%;
        padding: 1rem 2rem;
      }
    }
    
    /* Améliorations pour les écrans moyens */
    @media (min-width: 641px) and (max-width: 1024px) {
      .modal-content {
        max-width: 700px;
      }
      
      .modal-score-number {
        font-size: 3rem;
      }
    }
    
    /* Améliorations pour les grands écrans */
    @media (min-width: 1025px) {
      .modal-content {
        max-width: 700px;
      }
      
      .modal-content:hover {
        transform: scale(1.02);
        transition: transform 0.3s ease;
      }
    }
    
    /* Effets de focus et accessibilité */
    .modal-close:focus,
    .modal-footer .btn:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    
    /* Scrollbar personnalisée */
    .modal-content::-webkit-scrollbar {
      width: 8px;
    }
    
    .modal-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    
    .modal-content::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, var(--primary-color), var(--success-color));
      border-radius: 4px;
    }
    
    .modal-content::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, var(--success-color), var(--warning-color));
    }
    
    /* Loading Container pour le scan de vulnérabilités */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      min-height: 80px;
    }

    .loading-container .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-container .loading-text {
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
      margin: 0;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Bouton désactivé */
    .btn-disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .btn-disabled:hover {
      transform: none !important;
      box-shadow: none !important;
    }
    
    /* Amélioration de la lisibilité des détails de vulnérabilités */
    .details-list {
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .details-list::-webkit-scrollbar {
      width: 6px;
    }
    
    .details-list::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    
    .details-list::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, var(--primary-color), var(--success-color));
      border-radius: 3px;
    }
    
    .detail-item {
      margin-bottom: 0.75rem;
      line-height: 1.6;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.02);
      padding: 0.5rem;
      border-radius: 0.5rem;
      border-left: 3px solid var(--primary-color);
    }
    
    .detail-item:last-child {
      margin-bottom: 0;
    }
    
    /* Styles pour les sections de vulnérabilités */
    .vulnerability-section {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .vulnerability-section h5 {
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    /* Indicateurs de sévérité */
    .severity-critical {
      color: #ef4444;
      font-weight: 600;
    }
    
    .severity-high {
      color: #f97316;
      font-weight: 600;
    }
    
    .severity-medium {
      color: #eab308;
      font-weight: 600;
    }
    
    .severity-low {
      color: #22c55e;
      font-weight: 600;
    }
    

  `]
})
export class AuditsComponent {
  currentUrl = '';
  isLoading = signal(false);
  showResults = signal(false);
  overallScore = signal(0);
  auditResults = signal<AuditResult[]>([]);
  auditHistory = signal<AuditHistory[]>([]);
  
  // Modal properties
  showModal = signal(false);
  selectedResult = signal<AuditResult | null>(null);
  
  // Loading states
  isVulnScanLoading = signal(false);
  
  // Signal pour le chargement de l'audit SEO détaillé
  isSeoAuditLoading = signal(false);
  
  // Signal pour le chargement de l'audit des cookies détaillé
  isCookieAuditLoading = signal(false);

  // Méthode pour générer l'icône SSL SVG
  getSslIcon(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width: 24px; height: 24px; fill: black;">
      <path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/>
    </svg>`;
  }
  
  // Signal pour le chargement de l'audit des dépendances détaillé
  isDependencyAuditLoading = signal(false);
  
  // Signal pour le chargement de l'audit des bibliothèques backend détaillé
  isBackendLibrariesLoading = signal(false);
  
  // Cache des scans de vulnérabilités pour éviter les re-scans
  private vulnerabilityScanCache = new Map<string, any>();
  
  // Historique des scans avec timestamp pour gestion de la fraîcheur
  private scanHistory = new Map<string, { data: any, timestamp: number, url: string }>();
  
  // Durée de validité du cache (30 minutes)
  private readonly CACHE_VALIDITY_DURATION = 30 * 60 * 1000;

  constructor(private http: HttpClient) {
    // Charger l'historique des audits depuis le localStorage au démarrage
    this.loadAuditHistoryFromStorage();
    
    // Écouter les changements de thème
    this.setupThemeListener();
  }

  private setupThemeListener() {
    // Observer les changements d'attribut sur document.documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          // Forcer la détection de changement dans Angular
          setTimeout(() => {
            // Déclencher la détection de changement
            this.onThemeChange();
          }, 0);
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  getCardColor(result: any): string {
    // Détecter le mode sombre
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
      return '#111827';
    } else {
      return 'currentColor';
    }
  }

  getModalIconColor(result: any): string {
    // Détecter le mode sombre
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
      return '#ffffff'; // Blanc en mode sombre
    } else {
      return '#111827'; // Gris foncé en mode clair
    }
  }

  // Méthode pour forcer la mise à jour des couleurs lors du changement de thème
  onThemeChange() {
    // Cette méthode sera appelée quand le thème change
    // Elle force la détection de changement dans Angular
    return this.getCardColor({});
  }

  private mockResults: AuditResult[] = [
    {
      id: 'ssl',
      title: 'Certificat SSL',
      icon: this.getSslIcon(),
      score: 95,
      status: 'good',
      summary: 'Le certificat SSL est valide et correctement configuré avec un chiffrement fort.',
      details: [
        'Le certificat est valide jusqu\'au 31-12-2025',
        'Utilise le chiffrement TLS 1.3',
        'La chaîne de certificats est complète',
        'Aucun contenu mixte détecté'
      ]
    },
    {
      id: 'headers',
      title: 'En-têtes HTTP',
      icon: '🛡️',
      score: 78,
      status: 'warning',
      summary: 'La plupart des en-têtes de sécurité sont présents, mais certaines améliorations sont recommandées.',
      details: [
        'En-tête Content-Security-Policy manquant',
        'En-tête X-Frame-Options présent',
        'Strict-Transport-Security configuré',
        'X-Content-Type-Options présent'
      ]
    },
    {
      id: 'js-libraries',
      title: 'Bibliothèques JavaScript',
      icon: '📚',
      score: 65,
      status: 'warning',
      summary: 'Certaines bibliothèques JavaScript ont des vulnérabilités connues et doivent être mises à jour.',
      details: [
        'jQuery 3.4.1 a 2 vulnérabilités connues',
        'Bootstrap 4.5.2 est obsolète',
        'Lodash 4.17.15 nécessite une mise à jour de sécurité',
        '3 bibliothèques sont à jour'
      ]
    },
    {
      id: 'web-vulnerabilities',
      title: 'Vulnérabilités Web',
      icon: '🚨',
      score: 45,
      status: 'critical',
      summary: 'Vulnérabilités critiques détectées nécessitant une attention immédiate.',
      details: [
        'Vulnérabilité XSS potentielle dans le formulaire de contact',
        'Protection CSRF non implémentée',
        'Validation des entrées à améliorer',
        'Risque d\'injection SQL dans la fonctionnalité de recherche'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies et Sessions',
      icon: '🍪',
      score: 82,
      status: 'good',
      summary: 'La configuration des cookies est généralement sécurisée avec les drapeaux appropriés définis.',
      details: [
        'Drapeau HttpOnly défini sur les cookies de session',
        'Drapeau Secure activé pour HTTPS',
        'Attribut SameSite configuré',
        'Les temps d\'expiration des cookies sont raisonnables'
      ]
    },
    {
      id: 'dependencies',
      title: 'Audit des Dépendances',
      icon: '📦',
      score: 58,
      status: 'warning',
      summary: 'Plusieurs dépendances ont des vulnérabilités de sécurité ou sont obsolètes.',
      details: [
        '5 vulnérabilités de haute sévérité trouvées',
        '12 problèmes de sévérité modérée',
        '23 packages nécessitent des mises à jour',
        'Aucune vulnérabilité critique détectée'
      ]
    },
    {
      id: 'backend-scan',
      title: 'Bibliothèques Backend',
      icon: '⚙️',
      score: 73,
      status: 'warning',
      summary: 'Les bibliothèques backend sont généralement sécurisées mais certaines mises à jour sont recommandées.',
      details: [
        'La version d\'Express.js est à jour',
        'Le pilote de base de données nécessite une mise à jour',
        'La bibliothèque d\'authentification est sécurisée',
        '2 correctifs de sécurité mineurs disponibles'
      ]
    },
    {
      id: 'seo',
      title: 'Audit SEO',
      icon: '📊',
      score: 88,
      status: 'good',
      summary: 'L\'implémentation SEO est solide avec des opportunités d\'optimisation mineures.',
      details: [
        'Les méta-descriptions sont présentes sur toutes les pages',
        'Les balises de titre sont optimisées',
        'Les attributs alt des images manquent sur 3 images',
        'La vitesse de chargement des pages est excellente'
      ]
    }
  ];

  runAudit() {
    if (!this.currentUrl) return;

    this.isLoading.set(true);
    this.showResults.set(false);

    // Utiliser EXACTEMENT la même logique que liste-sites.component
    this.ajouterEtAuditer();
  }

  private calculateOverallScore() {
    const results = this.auditResults();
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    this.overallScore.set(Math.round(totalScore / results.length));
  }

  private addToHistory() {
    const history = this.auditHistory();
    const storedData = (this as any).lastAuditData;
    const newAudit: any = {
      url: this.currentUrl,
      date: new Date(),
      overallScore: this.overallScore(),
      // Sauvegarder les résultats complets de l'audit
      auditResults: [...this.auditResults()],
      // Ajouter l'ID d'audit si disponible
      auditId: storedData?.auditId || null
    };
    
    const updatedHistory = [newAudit, ...history.slice(0, 4)]; // Keep last 5
    this.auditHistory.set(updatedHistory);
    
    // Sauvegarder automatiquement dans le localStorage
    this.saveAuditHistoryToStorage(updatedHistory);
    
    console.log('💾 [AUDIT COMPONENT] Historique sauvegardé avec', this.auditResults().length, 'sections');
    console.log('💾 [AUDIT COMPONENT] Historique persisté dans le localStorage');
  }

  // Sauvegarder l'historique des audits dans le localStorage
  private saveAuditHistoryToStorage(history: AuditHistory[]) {
    try {
      // Convertir les dates en string pour le localStorage
      const historyForStorage = history.map(audit => ({
        ...audit,
        date: audit.date.toISOString()
      }));
      
      localStorage.setItem('auditHistory', JSON.stringify(historyForStorage));
      console.log('💾 [AUDIT COMPONENT] Historique sauvegardé dans le localStorage:', historyForStorage.length, 'audits');
    } catch (error) {
      console.error('❌ [AUDIT COMPONENT] Erreur lors de la sauvegarde dans le localStorage:', error);
    }
  }

  // Charger l'historique des audits depuis le localStorage
  private loadAuditHistoryFromStorage() {
    try {
      const storedHistory = localStorage.getItem('auditHistory');
      
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        
        // Convertir les dates string en objets Date
        const historyWithDates = parsedHistory.map((audit: any) => ({
          ...audit,
          date: new Date(audit.date)
        }));
        
        // Limiter à 3 audits maximum pour la persistance
        const limitedHistory = historyWithDates.slice(0, 3);
        
        this.auditHistory.set(limitedHistory);
        
        console.log('📂 [AUDIT COMPONENT] Historique chargé depuis le localStorage:', limitedHistory.length, 'audits');
        
        // Afficher les URLs des audits chargés
        limitedHistory.forEach((audit: AuditHistory, index: number) => {
          console.log(`📂 [AUDIT COMPONENT] Audit ${index + 1}: ${audit.url} - ${audit.overallScore}/100`);
        });
      } else {
        console.log('📂 [AUDIT COMPONENT] Aucun historique trouvé dans le localStorage');
      }
    } catch (error) {
      console.error('❌ [AUDIT COMPONENT] Erreur lors du chargement depuis le localStorage:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      this.auditHistory.set([]);
    }
  }

  loadHistoryAudit(audit: AuditHistory) {
    console.log('📚 [AUDIT COMPONENT] Chargement de l\'historique pour:', audit.url);
    
    // Mettre à jour l'URL courante
    this.currentUrl = audit.url;
    
    // Vérifier si on a les résultats complets sauvegardés
    if (audit.auditResults && audit.auditResults.length > 0) {
      console.log('✅ [AUDIT COMPONENT] Résultats complets trouvés dans l\'historique');
      
      // Restaurer exactement les mêmes résultats
      this.auditResults.set([...audit.auditResults]);
      this.overallScore.set(audit.overallScore);
      this.showResults.set(true);
      
      console.log('✅ [AUDIT COMPONENT] Historique restauré exactement -', audit.auditResults.length, 'sections');
      console.log('✅ [AUDIT COMPONENT] Score global:', audit.overallScore);
    } else {
      console.log('⚠️ [AUDIT COMPONENT] Aucun résultat détaillé trouvé, relancement de l\'audit...');
      // Si pas de résultats détaillés, relancer l'audit (comportement actuel)
      this.runAudit();
    }
  }

  viewDetails(result: AuditResult) {
    // Si c'est la carte "Vulnérabilités Web", vérifier le cache d'abord
    if (result.id === 'web-vulnerabilities') {
      if (!this.currentUrl || this.currentUrl.trim() === '') {
        console.error('❌ [AUDIT COMPONENT] Aucune URL disponible pour le scan des vulnérabilités');
        alert('❌ Aucune URL disponible. Veuillez d\'abord lancer un audit.');
        return;
      }
      
      // Vérifier si on a déjà un scan récent pour cette URL
      const cachedResult = this.getCachedVulnerabilityScan(this.currentUrl);
      if (cachedResult) {
        console.log('✅ [AUDIT COMPONENT] Utilisation du scan en cache pour:', this.currentUrl);
        
        // Utiliser automatiquement le cache si disponible (plus rapide)
        console.log(`✅ [AUDIT COMPONENT] Utilisation du scan en cache pour: ${this.currentUrl}`);
        console.log(`📋 Cache détecté le: ${new Date(cachedResult.timestamp).toLocaleString('fr-FR')}`);
        console.log(`🚨 Vulnérabilités en cache: ${cachedResult.totalVulnerabilities || 0}`);
        
        this.displayVulnerabilityResults(cachedResult, true);
      } else {
        console.log('🔄 [AUDIT COMPONENT] Lancement d\'un nouveau scan pour:', this.currentUrl);
        this.launchFullVulnerabilityScan(this.currentUrl);
      }
    } else if (result.id === 'seo') {
      // Pour la carte SEO, lancer l'audit SEO détaillé
      this.launchDetailedSeoAudit(result);
    } else if (result.id === 'cookies') {
      // Pour la carte Cookies & Sessions, lancer l'audit détaillé des cookies
      this.launchDetailedCookieAudit(result);
    } else if (result.id === 'dependencies') {
      // Pour la carte Dependencies Audit, lancer l'audit détaillé des dépendances
      this.launchDetailedDependencyAudit(result);
    } else if (result.id === 'backend-scan') {
      // Pour la carte Backend Libraries, lancer l'audit détaillé des bibliothèques backend
      this.launchDetailedBackendLibrariesAudit(result);
    } else {
      // Pour les autres cartes, afficher directement les détails
      this.selectedResult.set(result);
      this.showModal.set(true);
    }
  }
  
  closeModal() {
    this.showModal.set(false);
    this.selectedResult.set(null);
  }
  
  // Lancer un scan complet des vulnérabilités
  private launchFullVulnerabilityScan(url: string) {
    console.log('🔍 [AUDIT COMPONENT] Lancement du scan complet des vulnérabilités pour:', url);
    
    // Validation de l'URL
    if (!url || url.trim() === '') {
      console.error('❌ [AUDIT COMPONENT] URL invalide pour le scan:', url);
      this.isVulnScanLoading.set(false);
      alert('❌ URL invalide pour le scan des vulnérabilités');
      return;
    }
    
    // Nettoyer et valider l'URL
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      console.error('❌ [AUDIT COMPONENT] URL doit commencer par http:// ou https://:', cleanUrl);
      this.isVulnScanLoading.set(false);
      alert('❌ L\'URL doit commencer par http:// ou https://');
      return;
    }
    
    // Afficher l'indicateur de chargement spécifique au scan de vulnérabilités
    this.isVulnScanLoading.set(true);
    
    // Préparer les données de la requête avec plus de détails
    const requestBody = {
      websiteUrl: cleanUrl,
      scanType: 'full',
      includeDetails: true,
      maxPages: 10
    };
    
    console.log('📤 [AUDIT COMPONENT] Envoi de la requête de scan complet:', requestBody);
    
    this.http.post('/api/active-scanner/scan', requestBody).subscribe({
      next: (fullScanResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Scan complet terminé:', fullScanResult);
        this.isVulnScanLoading.set(false);
        
        // Utiliser la méthode centralisée pour afficher les résultats
        this.displayVulnerabilityResults(fullScanResult, false);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur scan complet vulnérabilités:', err);
        this.isVulnScanLoading.set(false);
        
        // Gestion d'erreur améliorée avec plus de détails
        let errorMsg = "Erreur lors du scan complet des vulnérabilités";
        
        if (err.status === 500) {
          errorMsg = "Erreur serveur interne (500) - Le scanner de vulnérabilités a rencontré un problème";
        } else if (err.status === 400) {
          errorMsg = "Requête invalide (400) - Vérifiez l'URL fournie";
        } else if (err.status === 401) {
          errorMsg = "Non autorisé (401) - Vérifiez votre authentification";
        } else if (err.status === 403) {
          errorMsg = "Accès interdit (403) - Vous n'avez pas les permissions nécessaires";
        } else if (err.status === 404) {
          errorMsg = "Endpoint non trouvé (404) - L'API de scan n'est pas disponible";
        } else if (err.status === 0) {
          errorMsg = "Erreur de connexion - Impossible de joindre le serveur";
        }
        
        // Ajouter les détails de l'erreur si disponibles
        if (err.error && err.error.message) {
          errorMsg += `\n\nDétails: ${err.error.message}`;
        } else if (err.message) {
          errorMsg += `\n\nDétails: ${err.message}`;
        }
        
        console.error('📋 [AUDIT COMPONENT] Détails de l\'erreur:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
          url: err.url
        });
        
        alert(`❌ ${errorMsg}`);
        
        // Fallback : essayer d'utiliser le scan rapide comme alternative
        console.log('🔄 [AUDIT COMPONENT] Tentative de fallback avec le scan rapide...');
        this.fallbackToQuickScan(url);
      }
    });
  }
  
  // Méthode de fallback vers le scan rapide
  private fallbackToQuickScan(url: string) {
    console.log('🔄 [AUDIT COMPONENT] Utilisation du scan rapide comme fallback pour:', url);
    
    this.http.get(`/api/active-scanner/quick-scan?websiteUrl=${encodeURIComponent(url)}`).subscribe({
      next: (quickScanResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Fallback scan rapide réussi:', quickScanResult);
        
        // Créer un résultat avec les données du scan rapide
        const fallbackVulnResult: AuditResult = {
          id: 'web-vulnerabilities-fallback',
          title: 'Vulnérabilités Web (Scan Rapide)',
          icon: '🚨',
          score: quickScanResult.totalVulnerabilities > 0 ? Math.max(50, 100 - quickScanResult.totalVulnerabilities * 10) : 100,
          status: quickScanResult.totalVulnerabilities > 3 ? 'critical' : quickScanResult.totalVulnerabilities > 1 ? 'warning' : 'good',
          summary: `Scan rapide terminé : ${quickScanResult.totalVulnerabilities || 0} vulnérabilités détectées (mode fallback)`,
          details: [
            '⚠️ Le scan complet a échoué, affichage des résultats du scan rapide',
            `Total des vulnérabilités : ${quickScanResult.totalVulnerabilities || 0}`,
            'Pour des détails complets, réessayez plus tard ou contactez l\'administrateur',
            'Les résultats du scan rapide peuvent être incomplets'
          ]
        };
        
        this.selectedResult.set(fallbackVulnResult);
        this.showModal.set(true);
        
        console.log('✅ Modal affiché avec les résultats du fallback');
      },
      error: (fallbackErr) => {
        console.error('❌ [AUDIT COMPONENT] Fallback scan rapide également échoué:', fallbackErr);
        
        // Dernier recours : afficher un message d'erreur dans le modal
        const errorVulnResult: AuditResult = {
          id: 'web-vulnerabilities-error',
          title: 'Erreur de Scan des Vulnérabilités',
          icon: '❌',
          score: 0,
          status: 'critical',
          summary: 'Impossible de récupérer les données de vulnérabilités',
          details: [
            '❌ Le scan complet des vulnérabilités a échoué',
            '❌ Le scan rapide de fallback a également échoué',
            '🔍 Vérifiez que le serveur de scan est opérationnel',
            '📞 Contactez l\'administrateur pour résoudre le problème',
            '🔄 Réessayez plus tard'
          ]
        };
        
        this.selectedResult.set(errorVulnResult);
        this.showModal.set(true);
      }
    });
  }

  // Lancer le scan rapide des vulnérabilités et combiner avec l'audit
  private launchQuickVulnerabilityScan(url: string, auditResult: any) {
    console.log('🔍 [AUDIT COMPONENT] Lancement du scan rapide des vulnérabilités pour:', url);
    
    // Stocker l'ID d'audit pour utilisation ultérieure
    if (auditResult.auditId) {
      console.log('💾 [AUDIT COMPONENT] Stockage de l\'ID d\'audit:', auditResult.auditId);
      (this as any).lastAuditData = auditResult;
    }
    
    this.http.get(`/api/active-scanner/quick-scan?websiteUrl=${encodeURIComponent(url)}`).subscribe({
      next: (vulnResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Scan rapide des vulnérabilités terminé:', vulnResult);
        
        // Combiner les résultats de l'audit et du scan de vulnérabilités
        const combinedResult = {
          ...auditResult,
          vulnerabilitiesCount: vulnResult.totalVulnerabilities || 0,
          vulnerabilityDetails: vulnResult.vulnerabilityCounts || {},
          scannedPages: vulnResult.scannedPages || 0
        };
        
        // Maintenant lancer l'audit SEO
        this.launchSeoAudit(url, combinedResult);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur scan rapide vulnérabilités:', err);
        
        // En cas d'erreur, afficher quand même les résultats de l'audit
        this.auditResults.set(this.convertBackendDataToResults(auditResult));
        this.overallScore.set(auditResult.globalScore || 0);
        this.addToHistory();
        
        this.isLoading.set(false);
        this.showResults.set(true);
        
        console.log('⚠️ Audit affiché sans données de vulnérabilités (erreur scan rapide)');
      }
    });
  }
  
  // Lancer l'audit SEO
  private launchSeoAudit(url: string, combinedResult: any) {
    console.log('🔍 [AUDIT COMPONENT] Lancement de l\'audit SEO pour:', url);
    
    // Configuration pour l'audit SEO rapide
    const seoRequest = {
      websiteUrl: url,
      checkInternalLinks: true,
      checkExternalLinks: true,
      checkRobotsTxt: true,
      checkSitemap: true,
      checkHttpsRedirect: true,
      maxPagesToScan: 3
    };
    
    // URL CORRECTE : /api/seo-audit/analyze (PAS quick-analyze)
    const correctSeoApiUrl = '/api/seo-audit/analyze';
    console.log('📡 [AUDIT COMPONENT] URL CORRECTE de l\'API SEO:', correctSeoApiUrl);
    console.log('📡 [AUDIT COMPONENT] Données de la requête SEO:', seoRequest);
    console.log('🚨 [AUDIT COMPONENT] ATTENTION : Si vous voyez quick-analyze dans les logs, il y a un problème de cache !');
    
    this.http.post(correctSeoApiUrl, seoRequest).subscribe({
      next: (seoResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Audit SEO terminé:', seoResult);
        
        if (seoResult.success) {
          console.log('📊 [AUDIT COMPONENT] Données SEO reçues:', seoResult);
          
          // Combiner avec les résultats précédents en mappant correctement les données
          const finalResult = {
            ...combinedResult,
            // Toujours propager le websiteId
            websiteId: combinedResult?.websiteId || (this as any).lastWebsiteId,
            seoScore: seoResult.globalScore || 0, // Votre API renvoie globalScore
            seoDetails: seoResult.checkResults || [], // Si disponible
            seoRecommendations: seoResult.recommendations || [], // Si disponible
            seoSummary: seoResult.message || 'Audit SEO terminé avec succès', // Utiliser le message de l'API
            seoAuditId: seoResult.seoAuditId // Garder l'ID de l'audit SEO
          };
          
          console.log('🔗 [AUDIT COMPONENT] ID de l\'audit SEO stocké:', finalResult.seoAuditId);
          
          console.log('🔗 [AUDIT COMPONENT] Données combinées pour l\'affichage:', finalResult);
          
          // Afficher tous les résultats combinés
          this.auditResults.set(this.convertBackendDataToResults(finalResult));
          this.overallScore.set(finalResult.globalScore || 0);
          this.addToHistory();
          
          this.isLoading.set(false);
          this.showResults.set(true);
          
          console.log(`✅ Audit complet terminé avec SEO (Score SEO: ${finalResult.seoScore}/100)`);
          
          // Maintenant lancer l'audit des cookies et sessions
          this.launchCookieSessionAudit(url, finalResult);
        } else {
          console.warn('⚠️ [AUDIT COMPONENT] Audit SEO échoué, affichage sans SEO');
          this.finalizeAudit(combinedResult);
        }
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur audit SEO:', err);
        
        // En cas d'erreur SEO, afficher quand même les autres résultats
        this.finalizeAudit(combinedResult);
      }
    });
  }

  // Lancer l'audit des cookies et sessions
  private launchCookieSessionAudit(url: string, combinedResult: any) {
    console.log('🍪 [AUDIT COMPONENT] Lancement de l\'audit des cookies et sessions pour:', url);
    
    // Configuration pour l'audit des cookies et sessions
    const cookieRequest = {
      websiteUrl: url
    };
    
    console.log('📡 [AUDIT COMPONENT] Appel de l\'API cookies et sessions:', cookieRequest);
    
    this.http.post('/api/cookie-session-security/analyze', cookieRequest).subscribe({
      next: (cookieResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Audit des cookies et sessions terminé:', cookieResult);
        
        if (cookieResult.success) {
          console.log('🍪 [AUDIT COMPONENT] Données cookies reçues:', cookieResult);
          
          // Combiner avec les résultats précédents
          const finalResult = {
            ...combinedResult,
            // Toujours propager le websiteId
            websiteId: combinedResult?.websiteId || (this as any).lastWebsiteId,
            cookieScore: cookieResult.globalScore || 0,
            cookieDetails: cookieResult.cookieAnalysis || {},
            sessionDetails: cookieResult.sessionAnalysis || {},
            totalIssues: cookieResult.totalIssues || 0,
            cookieCount: cookieResult.cookieCount || 0,
            sessionCount: cookieResult.sessionCount || 0
          };
          
          console.log('🔗 [AUDIT COMPONENT] Données finales combinées avec cookies:', finalResult);
          console.log('🧭 [AUDIT COMPONENT] websiteId pour dépendances:', finalResult.websiteId, 'lastWebsiteId:', (this as any).lastWebsiteId);
          
          // Afficher tous les résultats combinés
          this.auditResults.set(this.convertBackendDataToResults(finalResult));
          this.overallScore.set(finalResult.globalScore || 0);
          this.addToHistory();
          
          this.isLoading.set(false);
          this.showResults.set(true);
          
          console.log(`✅ Audit complet terminé avec cookies (Score cookies: ${finalResult.cookieScore}/100)`);
          
          // Maintenant lancer l'audit des dépendances
          this.launchDependencyAudit(url, finalResult);
        } else {
          console.warn('⚠️ [AUDIT COMPONENT] Audit des cookies échoué, affichage sans cookies');
          this.finalizeAudit(combinedResult);
        }
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur audit des cookies:', err);
        
        // En cas d'erreur cookies, afficher quand même les autres résultats
        this.finalizeAudit(combinedResult);
      }
    });
  }
  
    // Finaliser l'audit avec tous les résultats disponibles
  private finalizeAudit(auditResult: any) {
    // Stocker les données de l'audit pour pouvoir récupérer l'ID SEO plus tard
    (this as any).lastAuditData = auditResult;
    
    this.auditResults.set(this.convertBackendDataToResults(auditResult));
    this.overallScore.set(auditResult.globalScore || 0);
    this.addToHistory();

    this.isLoading.set(false);
    this.showResults.set(true);

    console.log('✅ Audit finalisé avec les résultats disponibles');
    console.log('💾 [AUDIT COMPONENT] Données d\'audit stockées pour récupération future:', auditResult);
  }

  // Lancer l'audit SEO détaillé depuis la carte SEO
  private launchDetailedSeoAudit(seoResult: AuditResult) {
    console.log('🔍 [AUDIT COMPONENT] Lancement de l\'audit SEO détaillé pour la carte:', seoResult);
    
    // Récupérer l'ID de l'audit SEO depuis les données
    const seoAuditId = this.getSeoAuditIdFromResult(seoResult);
    
    if (!seoAuditId) {
      console.error('❌ [AUDIT COMPONENT] Aucun ID d\'audit SEO trouvé');
      alert('❌ Impossible de récupérer l\'ID de l\'audit SEO. Veuillez relancer l\'audit.');
      return;
    }
    
    // Afficher l'indicateur de chargement SEO
    this.isSeoAuditLoading.set(true);
    
    console.log('📡 [AUDIT COMPONENT] Appel de l\'API SEO détaillée:', `/api/seo-audit/results/${seoAuditId}`);
    
    // Appeler l'API pour récupérer les résultats détaillés
    this.http.get(`/api/seo-audit/results/${seoAuditId}`).subscribe({
      next: (detailedSeoResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Résultats SEO détaillés reçus:', detailedSeoResult);
        
        // Arrêter l'indicateur de chargement
        this.isSeoAuditLoading.set(false);
        
        // Créer un résultat d'audit enrichi avec les détails SEO
        const enrichedSeoResult = this.enrichSeoResultWithDetails(seoResult, detailedSeoResult);
        
        // Afficher dans le modal
        this.selectedResult.set(enrichedSeoResult);
        this.showModal.set(true);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur lors de la récupération des détails SEO:', err);
        
        // Arrêter l'indicateur de chargement
        this.isSeoAuditLoading.set(false);
        
        // En cas d'erreur, afficher quand même les détails de base
        this.selectedResult.set(seoResult);
        this.showModal.set(true);
        
        // Afficher un message d'erreur dans le modal
        setTimeout(() => {
          alert('⚠️ Impossible de récupérer les détails SEO complets. Affichage des informations de base.');
        }, 100);
      }
    });
  }

  // Lancer l'audit détaillé des cookies et sessions
  private launchDetailedCookieAudit(cookieResult: AuditResult) {
    console.log('🍪 [AUDIT COMPONENT] Lancement de l\'audit détaillé des cookies pour la carte:', cookieResult);
    
    if (!this.currentUrl || this.currentUrl.trim() === '') {
      console.error('❌ [AUDIT COMPONENT] Aucune URL disponible pour l\'audit des cookies');
      alert('❌ Aucune URL disponible. Veuillez d\'abord lancer un audit.');
      return;
    }
    
    // Afficher l'indicateur de chargement des cookies
    this.isCookieAuditLoading.set(true);
    
    // Configuration pour l'audit des cookies et sessions
    const cookieRequest = {
      websiteUrl: this.currentUrl
    };
    
    console.log('📡 [AUDIT COMPONENT] Appel de l\'API cookies détaillée:', cookieRequest);
    
    // Appeler l'API pour récupérer les résultats détaillés des cookies
    this.http.post('/api/cookie-session-security/analyze', cookieRequest).subscribe({
      next: (detailedCookieResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Résultats cookies détaillés reçus:', detailedCookieResult);
        
        // Arrêter l'indicateur de chargement
        this.isCookieAuditLoading.set(false);
        
        // Créer un résultat d'audit enrichi avec les détails des cookies
        const enrichedCookieResult = this.enrichCookieResultWithDetails(cookieResult, detailedCookieResult);
        
        // Afficher dans le modal
        this.selectedResult.set(enrichedCookieResult);
        this.showModal.set(true);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur lors de la récupération des détails des cookies:', err);
        
        // Arrêter l'indicateur de chargement
        this.isCookieAuditLoading.set(false);
        
        // En cas d'erreur, afficher quand même les détails de base
        this.selectedResult.set(cookieResult);
        this.showModal.set(true);
        
        // Afficher un message d'erreur dans le modal
        setTimeout(() => {
          alert('⚠️ Impossible de récupérer les détails des cookies complets. Affichage des informations de base.');
        }, 100);
      }
    });
  }

  // Enrichir le résultat des cookies avec les détails de l'API
  private enrichCookieResultWithDetails(cookieResult: AuditResult, detailedResult: any): AuditResult {
    console.log('🍪 [AUDIT COMPONENT] Enrichissement du résultat cookies avec les détails:', detailedResult);
    
    // Construire les détails organisés
    const details: string[] = [];
    
    // 1. Informations générales
    details.push(`🎯 Score global des cookies: ${detailedResult.globalScore || 0}/100`);
    details.push(`🌐 Site analysé: ${detailedResult.websiteUrl || 'N/A'}`);
    details.push(`📅 Analyse effectuée: ${new Date(detailedResult.timestamp || Date.now()).toLocaleString('fr-FR')}`);
    details.push('');
    
    // 2. Analyse des cookies
    if (detailedResult.cookieAnalysis) {
      const cookieAnalysis = detailedResult.cookieAnalysis;
      details.push('🍪 ANALYSE DES COOKIES:');
      details.push(`📊 Total des cookies détectés: ${cookieAnalysis.totalCookies || 0}`);
      details.push(`⚠️ Problèmes détectés: ${cookieAnalysis.totalIssues || 0}`);
      
      if (cookieAnalysis.cookies && cookieAnalysis.cookies.length > 0) {
        details.push('');
        details.push('📋 DÉTAILS DES COOKIES:');
        cookieAnalysis.cookies.forEach((cookie: any, index: number) => {
          details.push(`  ${index + 1}. ${cookie.name || 'Cookie sans nom'}`);
          details.push(`     🔗 URL: ${cookie.pageUrl || 'N/A'}`);
          details.push(`     🔒 HttpOnly: ${cookie.httpOnly ? '✅ Oui' : '❌ Non'}`);
          details.push(`     🛡️ Secure: ${cookie.secure ? '✅ Oui' : '❌ Non'}`);
          details.push(`     🌐 SameSite: ${cookie.sameSite ? '✅ Oui' : '❌ Non'}`);
          if (cookie.sameSiteValue) {
            details.push(`     📝 Valeur SameSite: ${cookie.sameSiteValue}`);
          }
          if (cookie.expires) {
            details.push(`     ⏰ Expire: ${cookie.expires}`);
          }
          if (cookie.maxAge) {
            details.push(`     ⏱️ Max-Age: ${cookie.maxAge} secondes`);
          }
          if (cookie.lifetimeDays) {
            details.push(`     📅 Durée de vie: ${cookie.lifetimeDays} jours`);
          }
          details.push('');
        });
      }
      
      // 3. Problèmes de sécurité des cookies
      if (cookieAnalysis.issues && cookieAnalysis.issues.length > 0) {
        details.push('🚨 PROBLÈMES DE SÉCURITÉ DÉTECTÉS:');
        cookieAnalysis.issues.forEach((issue: any, index: number) => {
          details.push(`  ${index + 1}. ${issue.title || 'Problème de sécurité'}`);
          details.push(`     📝 Description: ${issue.description || 'N/A'}`);
          details.push(`     ⚠️ Sévérité: ${issue.severity || 'N/A'}`);
          details.push(`     🔗 Contexte: ${issue.context || 'N/A'}`);
          details.push('');
        });
      }
    }
    
    // 4. Analyse des sessions
    if (detailedResult.sessionAnalysis) {
      const sessionAnalysis = detailedResult.sessionAnalysis;
      details.push('🔐 ANALYSE DES SESSIONS:');
      details.push(`📊 Total des problèmes de session: ${sessionAnalysis.totalIssues || 0}`);
      details.push(`🍪 Cookies de session détectés: ${sessionAnalysis.sessionCookies ? sessionAnalysis.sessionCookies.length : 0}`);
      details.push(`🔍 Indicateurs de session: ${sessionAnalysis.hasSessionIndicators ? '✅ Détectés' : '❌ Non détectés'}`);
      
      if (sessionAnalysis.sessionCookies && sessionAnalysis.sessionCookies.length > 0) {
        details.push('');
        details.push('📋 COOKIES DE SESSION:');
        sessionAnalysis.sessionCookies.forEach((sessionCookie: any, index: number) => {
          details.push(`  ${index + 1}. ${sessionCookie.name || 'Cookie de session sans nom'}`);
          details.push(`     🔗 URL: ${sessionCookie.pageUrl || 'N/A'}`);
          details.push(`     🔒 HttpOnly: ${sessionCookie.httpOnly ? '✅ Oui' : '❌ Non'}`);
          details.push(`     🛡️ Secure: ${sessionCookie.secure ? '✅ Oui' : '❌ Non'}`);
          details.push(`     🌐 SameSite: ${sessionCookie.sameSite ? '✅ Oui' : '❌ Non'}`);
          details.push('');
        });
      }
    }
    
    // 5. Analyse de fixation de session
    if (detailedResult.sessionFixationAnalysis) {
      const fixationAnalysis = detailedResult.sessionFixationAnalysis;
      details.push('🔒 ANALYSE DE FIXATION DE SESSION:');
      details.push(`📊 Problèmes de fixation: ${fixationAnalysis.totalIssues || 0}`);
      if (fixationAnalysis.loginUrl) {
        details.push(`🔗 URL de connexion détectée: ${fixationAnalysis.loginUrl}`);
      }
    }
    
    // 6. Problèmes de sécurité généraux
    if (detailedResult.securityIssues && detailedResult.securityIssues.length > 0) {
      details.push('');
      details.push('🚨 PROBLÈMES DE SÉCURITÉ GÉNÉRAUX:');
      detailedResult.securityIssues.forEach((issue: any, index: number) => {
        details.push(`  ${index + 1}. ${issue.title || 'Problème de sécurité'}`);
        details.push(`     📝 Description: ${issue.description || 'N/A'}`);
        details.push(`     ⚠️ Sévérité: ${issue.severity || 'N/A'}`);
        details.push(`     🔗 Contexte: ${issue.context || 'N/A'}`);
        details.push('');
      });
    }
    
    // 7. Résumé final
    details.push('📊 RÉSUMÉ:');
    details.push(`🎯 Score global: ${detailedResult.globalScore || 0}/100`);
    details.push(`⚠️ Total des problèmes: ${detailedResult.totalIssues || 0}`);
    
    if (detailedResult.globalScore >= 80) {
      details.push('✅ Configuration des cookies excellente');
    } else if (detailedResult.globalScore >= 60) {
      details.push('⚠️ Configuration des cookies acceptable avec améliorations possibles');
    } else {
      details.push('❌ Configuration des cookies nécessite des améliorations importantes');
    }
    
    // Retourner le résultat enrichi
    return {
      ...cookieResult,
      score: detailedResult.globalScore || cookieResult.score,
      status: detailedResult.globalScore >= 80 ? 'good' : detailedResult.globalScore >= 60 ? 'warning' : 'critical',
      summary: `Analyse détaillée des cookies et sessions (Score: ${detailedResult.globalScore || 0}/100)`,
      details: details
    };
  }

  // Lancer l'audit détaillé des dépendances
  private launchDetailedDependencyAudit(dependencyResult: AuditResult) {
    console.log('📦 [AUDIT COMPONENT] Lancement de l\'audit détaillé des dépendances pour la carte:', dependencyResult);
    
    // Afficher l'indicateur de chargement des dépendances
    this.isDependencyAuditLoading.set(true);
    
    // Récupérer le websiteId d'abord pour lancer l'endpoint souhaité
    const websiteId = (this as any).lastWebsiteId;
    if (!websiteId) {
      console.warn('⚠️ [AUDIT COMPONENT] Aucun websiteId disponible, fallback sur auditId');
      // Fallback: utiliser auditId si websiteId absent
      const auditIdFallback = this.getAuditIdFromStoredData();
      if (!auditIdFallback) {
        console.error('❌ [AUDIT COMPONENT] Aucun ID disponible pour l\'audit détaillé des dépendances');
        this.isDependencyAuditLoading.set(false);
        alert('❌ Impossible de récupérer les identifiants. Veuillez relancer l\'audit.');
        return;
      }
      console.log('📡 [AUDIT COMPONENT] Appel fallback dépendances détaillées (auditId):', `/api/dependency-audit/maven/${auditIdFallback}`);
      this.http.post(`/api/dependency-audit/maven/${auditIdFallback}`, {}).subscribe({
        next: (detailedDependencyResult: any) => {
          console.log('✅ [AUDIT COMPONENT] Résultats dépendances détaillés reçus (fallback):', detailedDependencyResult);
          this.isDependencyAuditLoading.set(false);
          const enrichedDependencyResult = this.enrichDependencyResultWithDetails(dependencyResult, detailedDependencyResult);
          this.selectedResult.set(enrichedDependencyResult);
          this.showModal.set(true);
        },
        error: (err) => {
          console.error('❌ [AUDIT COMPONENT] Erreur lors du fallback dépendances détaillées:', err);
          this.isDependencyAuditLoading.set(false);
          this.selectedResult.set(dependencyResult);
          this.showModal.set(true);
          setTimeout(() => {
            alert('⚠️ Impossible de récupérer les détails des dépendances complets. Affichage des informations de base.');
          }, 100);
        }
      });
      return;
    }

    console.log('📡 [AUDIT COMPONENT] Appel dépendances détaillées (websiteId):', `/api/audits/launch-dependency-audit/${websiteId}`);
    this.http.post(`/api/audits/launch-dependency-audit/${websiteId}`, {}).subscribe({
      next: (detailedDependencyResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Résultats dépendances détaillés reçus (websiteId):', detailedDependencyResult);
        
        // Arrêter l'indicateur de chargement
        this.isDependencyAuditLoading.set(false);
        
        // Normaliser la structure (backend renvoie dependencyAuditResult)
        const normalized = {
          success: detailedDependencyResult?.success,
          message: detailedDependencyResult?.message,
          auditId: detailedDependencyResult?.auditId,
          data: detailedDependencyResult?.dependencyAuditResult || detailedDependencyResult?.data || detailedDependencyResult
        };
        
        const enrichedDependencyResult = this.enrichDependencyResultWithDetails(dependencyResult, normalized);
        
        // Afficher dans le modal
        this.selectedResult.set(enrichedDependencyResult);
        this.showModal.set(true);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur lors de la récupération des détails des dépendances (websiteId):', err);
        
        // Arrêter l'indicateur de chargement
        this.isDependencyAuditLoading.set(false);
        
        // En cas d'erreur, afficher quand même les détails de base
        this.selectedResult.set(dependencyResult);
        this.showModal.set(true);
        
        // Afficher un message d'erreur dans le modal
        setTimeout(() => {
          alert('⚠️ Impossible de récupérer les détails des dépendances complets. Affichage des informations de base.');
        }, 100);
      }
    });
  }

  // Enrichir le résultat des dépendances avec les détails de l'API
  private enrichDependencyResultWithDetails(dependencyResult: AuditResult, detailedResult: any): AuditResult {
    console.log('📦 [AUDIT COMPONENT] Enrichissement du résultat dépendances avec les détails:', detailedResult);
    
    // Normaliser la structure de réponse
    const data = detailedResult.data || detailedResult.dependencyAuditResult || detailedResult || {};
    const scoreVal = (data.globalScore ?? 0);
    const resolvedAuditId = detailedResult.auditId || data.auditId;
    
    // Construire les détails organisés
    const details: string[] = [];
    
    // 1. Informations générales
    details.push(`🎯 Score global des dépendances: ${scoreVal}/100`);
    details.push(`📅 Analyse effectuée: ${new Date().toLocaleString('fr-FR')}`);
    details.push(`✅ Succès: ${detailedResult.success ? 'Oui' : 'Non'}`);
    details.push(`📝 Message: ${detailedResult.message || 'N/A'}`);
    if (resolvedAuditId) details.push(`🆔 ID de l'audit: ${resolvedAuditId}`);
    details.push('');
    
    // 2. Statistiques des dépendances
    details.push('📊 STATISTIQUES DES DÉPENDANCES:');
    details.push(`📦 Total des dépendances: ${data.totalDependencies || 0}`);
    details.push(`🚨 Dépendances vulnérables: ${data.vulnerableDependencies || data.vulnerableCount || 0}`);
    details.push(`🔴 Vulnérabilités critiques: ${data.criticalVulnerabilities || data.criticalCount || 0}`);
    details.push(`🟠 Vulnérabilités élevées: ${data.highVulnerabilities || data.highCount || 0}`);
    details.push(`🟡 Vulnérabilités moyennes: ${data.mediumVulnerabilities || data.mediumCount || 0}`);
    details.push(`🟢 Vulnérabilités faibles: ${data.lowVulnerabilities || data.lowCount || 0}`);
    details.push('');
    
    // 3. Liste des dépendances
    if (Array.isArray(data.dependencies) && data.dependencies.length > 0) {
      details.push('📋 LISTE DES DÉPENDANCES:');
      data.dependencies.forEach((dep: any, index: number) => {
        details.push(`  ${index + 1}. ${dep.artifactId || dep.dependencyName || 'Dépendance sans nom'}`);
        details.push(`     📦 Groupe: ${dep.groupId || 'N/A'}`);
        details.push(`     📝 Version: ${dep.version || dep.currentVersion || 'N/A'}`);
        details.push(`     🔧 Type: ${dep.type || 'N/A'}`);
        if (dep.id) details.push(`     🆔 ID: ${dep.id}`);
        details.push('');
      });
    }
    
    // 4. Vulnérabilités détaillées
    if (Array.isArray(data.vulnerabilities) && data.vulnerabilities.length > 0) {
      details.push('🚨 VULNÉRABILITÉS DÉTECTÉES:');
      data.vulnerabilities.forEach((vuln: any, index: number) => {
        details.push(`  ${index + 1}. ${vuln.dependencyName || vuln.artifactId || 'Dépendance sans nom'}`);
        details.push(`     📦 Groupe: ${vuln.groupId || 'N/A'}`);
        details.push(`     📝 Version vulnérable: ${vuln.vulnerableVersion || 'N/A'}`);
        details.push(`     ⚠️ Sévérité: ${vuln.severity || 'N/A'}`);
        details.push(`     🔗 CVE: ${vuln.cve || 'N/A'}`);
        if (vuln.id) details.push(`     🆔 ID: ${vuln.id}`);
        details.push('');
      });
    }
    
    // 5. Recommandations basées sur les vulnérabilités
    if (Array.isArray(data.vulnerabilities) && data.vulnerabilities.length > 0) {
      details.push('💡 RECOMMANDATIONS:');
      const criticalVulns = data.vulnerabilities.filter((v: any) => v.severity === 'CRITICAL');
      const highVulns = data.vulnerabilities.filter((v: any) => v.severity === 'HIGH');
      const mediumVulns = data.vulnerabilities.filter((v: any) => v.severity === 'MEDIUM');
      const lowVulns = data.vulnerabilities.filter((v: any) => v.severity === 'LOW');
      if (criticalVulns.length > 0) {
        details.push(`  🔴 CRITIQUE: Mettre à jour immédiatement ${criticalVulns.length} dépendance(s) critique(s)`);
        criticalVulns.forEach((vuln: any) => details.push(`     - ${vuln.dependencyName || vuln.artifactId} (${vuln.cve})`));
        details.push('');
      }
      if (highVulns.length > 0) {
        details.push(`  🟠 ÉLEVÉ: Mettre à jour rapidement ${highVulns.length} dépendance(s) avec vulnérabilités élevées`);
        highVulns.forEach((vuln: any) => details.push(`     - ${vuln.dependencyName || vuln.artifactId} (${vuln.cve})`));
        details.push('');
      }
      if (mediumVulns.length > 0) {
        details.push(`  🟡 MOYEN: Planifier la mise à jour de ${mediumVulns.length} dépendance(s) avec vulnérabilités moyennes`);
        details.push('');
      }
      if (lowVulns.length > 0) {
        details.push(`  🟢 FAIBLE: Surveiller ${lowVulns.length} dépendance(s) avec vulnérabilités faibles`);
        details.push('');
      }
    }
    
    // Retourner le résultat enrichi avec le bon score
    return {
      ...dependencyResult,
      score: scoreVal,
      status: scoreVal >= 80 ? 'good' : scoreVal >= 60 ? 'warning' : 'critical',
      summary: `Analyse détaillée des dépendances (Score: ${scoreVal}/100)`,
      details
    };
  }

  // Lancer l'audit détaillé des bibliothèques backend
  private launchDetailedBackendLibrariesAudit(backendResult: AuditResult) {
    console.log('⚙️ [AUDIT COMPONENT] Lancement de l\'audit détaillé des bibliothèques backend pour la carte:', backendResult);
    
    if (!this.currentUrl || this.currentUrl.trim() === '') {
      console.error('❌ [AUDIT COMPONENT] Aucune URL disponible pour l\'audit des bibliothèques backend');
      alert('❌ Aucune URL disponible. Veuillez d\'abord lancer un audit.');
      return;
    }
    
    // Afficher l'indicateur de chargement
    this.isBackendLibrariesLoading.set(true);
    
    console.log('📡 [AUDIT COMPONENT] Appel de l\'API backend-libraries détaillée:', `/api/audits/backend-libraries?url=${encodeURIComponent(this.currentUrl)}`);
    
    this.http.get(`/api/audits/backend-libraries?url=${encodeURIComponent(this.currentUrl)}`).subscribe({
      next: (detailedBackendResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Résultats bibliothèques backend détaillés reçus:', detailedBackendResult);
        
        // Arrêter l'indicateur de chargement
        this.isBackendLibrariesLoading.set(false);
        
        // Créer un résultat d'audit enrichi avec les détails des bibliothèques backend
        const enrichedBackendResult = this.enrichBackendLibrariesResultWithDetails(backendResult, detailedBackendResult);
        
        // Afficher dans le modal
        this.selectedResult.set(enrichedBackendResult);
        this.showModal.set(true);
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur lors de la récupération des détails des bibliothèques backend:', err);
        
        // Arrêter l'indicateur de chargement
        this.isBackendLibrariesLoading.set(false);
        
        // En cas d'erreur, afficher quand même les détails de base
        this.selectedResult.set(backendResult);
        this.showModal.set(true);
        
        // Afficher un message d'erreur dans le modal
        setTimeout(() => {
          alert('⚠️ Impossible de récupérer les détails des bibliothèques backend complets. Affichage des informations de base.');
        }, 100);
      }
    });
  }

  // Enrichir le résultat des bibliothèques backend avec les détails de l'API
  private enrichBackendLibrariesResultWithDetails(backendResult: AuditResult, detailedResult: any): AuditResult {
    console.log('⚙️ [AUDIT COMPONENT] Enrichissement du résultat bibliothèques backend avec les détails:', detailedResult);
    
    // Normaliser la structure de réponse
    const data = detailedResult.backendLibrariesResult || detailedResult || {};
    const scoreVal = data.backendLibrariesScore || 0;
    
    // Construire les détails organisés
    const details: string[] = [];
    
    // 1. Informations générales
    details.push(`🎯 Score global des bibliothèques backend: ${scoreVal}/100`);
    details.push(`📅 Analyse effectuée: ${new Date().toLocaleString('fr-FR')}`);
    details.push(`✅ Succès: ${detailedResult.success ? 'Oui' : 'Non'}`);
    details.push(`📝 Message: ${detailedResult.message || data.backendLibrariesMessage || 'N/A'}`);
    details.push(`🔍 Statut: ${data.backendLibrariesStatus || 'UNKNOWN'}`);
    details.push('');
    
    // 2. Détails des bibliothèques (selon la structure de votre API)
    if (data.details && Array.isArray(data.details) && data.details.length > 0) {
      details.push('📚 BIBLIOTHÈQUES BACKEND ANALYSÉES:');
      details.push('');
      
      data.details.forEach((library: any, index: number) => {
        details.push(`🔧 ${library.library || 'Bibliothèque inconnue'}`);
        details.push(`   Version: ${library.version || 'Inconnue'}`);
        
        if (library.cve) {
          details.push(`   CVE: ${library.cve}`);
        }
        
        if (library.severity && library.severity !== 'UNKNOWN') {
          const severityIcon = this.getSeverityIcon(library.severity);
          details.push(`   Sévérité: ${severityIcon} ${library.severity}`);
        }
        
        if (library.cvssScore !== undefined && library.cvssScore > 0) {
          details.push(`   Score CVSS: ${library.cvssScore}/10`);
        }
        
        if (library.description) {
          details.push(`   Description: ${library.description}`);
        }
        
        // Ajouter une ligne de séparation entre les bibliothèques
        if (index < data.details.length - 1) {
          details.push('');
        }
      });
      
      details.push('');
    }
    
    // 3. Statistiques des vulnérabilités
    if (data.details && Array.isArray(data.details)) {
      const criticalCount = data.details.filter((lib: any) => lib.severity === 'CRITICAL').length;
      const highCount = data.details.filter((lib: any) => lib.severity === 'HIGH').length;
      const mediumCount = data.details.filter((lib: any) => lib.severity === 'MEDIUM').length;
      const lowCount = data.details.filter((lib: any) => lib.severity === 'LOW').length;
      const unknownCount = data.details.filter((lib: any) => lib.severity === 'UNKNOWN').length;
      
      details.push('📊 STATISTIQUES DES VULNÉRABILITÉS:');
      details.push(`🔴 Critiques: ${criticalCount}`);
      details.push(`🟠 Élevées: ${highCount}`);
      details.push(`🟡 Moyennes: ${mediumCount}`);
      details.push(`🟢 Faibles: ${lowCount}`);
      details.push(`❓ Inconnues: ${unknownCount}`);
      details.push(`📦 Total des bibliothèques: ${data.details.length}`);
      details.push('');
    }
    
    // 4. Recommandations basées sur les vulnérabilités
    if (data.details && Array.isArray(data.details)) {
      const hasVulnerabilities = data.details.some((lib: any) => 
        lib.severity && lib.severity !== 'UNKNOWN' && lib.severity !== 'LOW'
      );
      
      details.push('💡 RECOMMANDATIONS:');
      
      if (hasVulnerabilities) {
        details.push('• Mettre à jour les bibliothèques avec des vulnérabilités critiques ou élevées');
        details.push('• Vérifier les versions des bibliothèques avec des vulnérabilités moyennes');
        details.push('• Surveiller les mises à jour de sécurité pour toutes les bibliothèques');
        details.push('• Consulter les bulletins de sécurité officiels des bibliothèques');
      } else {
        details.push('• Continuer à surveiller les mises à jour de sécurité');
        details.push('• Maintenir les bibliothèques à jour régulièrement');
        details.push('• Configurer des alertes pour les nouvelles vulnérabilités');
      }
      
      details.push('');
    }
    
    // 5. Résumé de sécurité
    details.push('🛡️ RÉSUMÉ DE SÉCURITÉ:');
    if (scoreVal >= 90) {
      details.push('✅ Excellent niveau de sécurité des bibliothèques backend');
      details.push('✅ Toutes les bibliothèques sont sécurisées');
      details.push('✅ Aucune vulnérabilité critique détectée');
    } else if (scoreVal >= 80) {
      details.push('✅ Bon niveau de sécurité des bibliothèques backend');
      details.push('✅ Quelques améliorations mineures possibles');
      details.push('✅ Configuration de sécurité appropriée');
    } else if (scoreVal >= 60) {
      details.push('⚠️ Niveau de sécurité acceptable avec améliorations nécessaires');
      details.push('⚠️ Certaines bibliothèques nécessitent des mises à jour');
      details.push('🔧 Plan de mise à jour recommandé');
    } else {
      details.push('❌ Niveau de sécurité insuffisant');
      details.push('❌ Vulnérabilités importantes détectées');
      details.push('🚨 Action immédiate requise pour la sécurité');
    }
    
    // Retourner le résultat enrichi
    return {
      ...backendResult,
      score: scoreVal,
      status: scoreVal >= 80 ? 'good' : scoreVal >= 60 ? 'warning' : 'critical',
      summary: `Analyse détaillée des bibliothèques backend (Score: ${scoreVal}/100)`,
      details
    };
  }

  // Lancer l'audit des dépendances dans le flux principal
  private launchDependencyAudit(url: string, combinedResult: any) {
    console.log('📦 [AUDIT COMPONENT] Lancement de l\'audit des dépendances pour:', url);
    
    // Récupérer l'auditId depuis les résultats combinés ou depuis stockage
    const auditId = combinedResult?.auditId || this.getAuditIdFromStoredData();
    console.log('🧭 [AUDIT COMPONENT] auditId détecté pour dépendances:', auditId, 'depuis combinedResult:', combinedResult?.auditId);
    if (!auditId) {
      console.warn('⚠️ [AUDIT COMPONENT] Aucun auditId disponible pour l\'audit des dépendances');
      this.finalizeAudit(combinedResult);
      return;
    }

    console.log('📡 [AUDIT COMPONENT] Appel de l\'API dépendances (par auditId):', `/api/dependency-audit/maven/${auditId}`);
    
    // Appeler l'API demandée: POST /api/dependency-audit/maven/{auditId}
    this.http.post(`/api/dependency-audit/maven/${auditId}`, {}).subscribe({
      next: (dependencyResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Audit des dépendances (par auditId) terminé:', dependencyResult);
        
        if (dependencyResult) {
          // Supporter différentes formes de réponse (souvent sous data)
          const depData = dependencyResult.data || dependencyResult.dependencyAuditResult || dependencyResult;
          const stats = depData.statistics || depData;

          // Conserver auditId si fourni au niveau top
          const depAuditId = dependencyResult.auditId || depData.auditId || auditId;
          if (!(this as any).lastAuditData) (this as any).lastAuditData = {};
          if (depAuditId) (this as any).lastAuditData.auditId = depAuditId;

          // Combiner avec les résultats précédents
          const finalResult = {
            ...combinedResult,
            auditId: depAuditId,
            dependencyScore: (depData.globalScore ?? 0),
            dependencyDetails: depData || {},
            dependencyStatistics: depData.statistics || {},
            totalDependencies: stats.totalDependencies || 0,
            vulnerableDependencies: stats.vulnerableDependencies || stats.vulnerableCount || 0,
            criticalVulnerabilities: stats.criticalVulnerabilities || stats.criticalCount || 0,
            highVulnerabilities: stats.highVulnerabilities || stats.highCount || 0,
            mediumVulnerabilities: stats.mediumVulnerabilities || stats.mediumCount || 0,
            lowVulnerabilities: stats.lowVulnerabilities || stats.lowCount || 0,
            outdatedDependencies: stats.outdatedDependencies || 0
          };
          
          console.log('🔗 [AUDIT COMPONENT] Données finales combinées avec dépendances (par auditId):', finalResult);
          
          // Afficher tous les résultats combinés
          this.auditResults.set(this.convertBackendDataToResults(finalResult));
          this.overallScore.set(finalResult.globalScore || 0);
          this.addToHistory();
          
          this.isLoading.set(false);
          this.showResults.set(true);
          
          console.log(`✅ Audit complet terminé avec dépendances (Score dépendances: ${finalResult.dependencyScore}/100)`);
          
          // Maintenant lancer l'audit des bibliothèques backend
          this.launchBackendLibrariesAudit(url, finalResult);
        } else {
          console.warn('⚠️ [AUDIT COMPONENT] Réponse dépendances vide, affichage sans dépendances');
          this.finalizeAudit(combinedResult);
        }
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur audit des dépendances (par auditId):', err);
        this.finalizeAudit(combinedResult);
      }
    });
  }

  // Lancer l'audit des bibliothèques backend
  private launchBackendLibrariesAudit(url: string, combinedResult: any) {
    console.log('⚙️ [AUDIT COMPONENT] Lancement de l\'audit des bibliothèques backend pour:', url);
    
    console.log('📡 [AUDIT COMPONENT] Appel de l\'API backend-libraries:', `/api/audits/backend-libraries?url=${encodeURIComponent(url)}`);
    
    this.http.get(`/api/audits/backend-libraries?url=${encodeURIComponent(url)}`).subscribe({
      next: (backendResult: any) => {
        console.log('✅ [AUDIT COMPONENT] Audit des bibliothèques backend terminé:', backendResult);
        
        if (backendResult.success && backendResult.backendLibrariesResult) {
          const backendData = backendResult.backendLibrariesResult;
          
          // Combiner avec les résultats précédents
          const finalResult = {
            ...combinedResult,
            backendLibrariesScore: backendData.backendLibrariesScore || 0,
            backendLibrariesStatus: backendData.backendLibrariesStatus || 'UNKNOWN',
            backendLibrariesMessage: backendData.backendLibrariesMessage || '',
            backendLibrariesDetails: backendData || {}
          };
          
          console.log('🔗 [AUDIT COMPONENT] Données finales combinées avec bibliothèques backend:', finalResult);
          
          // Afficher tous les résultats combinés
          this.auditResults.set(this.convertBackendDataToResults(finalResult));
          this.overallScore.set(finalResult.globalScore || 0);
          this.addToHistory();
          
          this.isLoading.set(false);
          this.showResults.set(true);
          
          console.log(`✅ Audit complet terminé avec bibliothèques backend (Score backend: ${finalResult.backendLibrariesScore}/100)`);
        } else {
          console.warn('⚠️ [AUDIT COMPONENT] Réponse bibliothèques backend vide ou échouée, affichage sans backend');
          this.finalizeAudit(combinedResult);
        }
      },
      error: (err) => {
        console.error('❌ [AUDIT COMPONENT] Erreur audit des bibliothèques backend:', err);
        this.finalizeAudit(combinedResult);
      }
    });
  }

  // Récupérer l'ID de l'audit depuis les données stockées
  private getAuditIdFromStoredData(): number | null {
    console.log('🔍 [AUDIT COMPONENT] Recherche de l\'ID de l\'audit...');
    
    // Essayer de récupérer l'ID depuis les données d'audit stockées
    const storedData = (this as any).lastAuditData;
    if (storedData && storedData.auditId) {
      console.log('✅ [AUDIT COMPONENT] ID d\'audit trouvé dans les données stockées:', storedData.auditId);
      return storedData.auditId;
    }
    
    // Essayer de récupérer l'ID depuis l'historique (en utilisant any pour éviter l'erreur TypeScript)
    const history = this.auditHistory();
    if (history.length > 0 && (history[0] as any).auditId) {
      console.log('✅ [AUDIT COMPONENT] ID d\'audit trouvé dans l\'historique:', (history[0] as any).auditId);
      return (history[0] as any).auditId;
    }
    
    console.warn('⚠️ [AUDIT COMPONENT] Aucun ID d\'audit trouvé');
    return null;
  }

  // Récupérer l'ID de l'audit SEO depuis le résultat
  private getSeoAuditIdFromResult(seoResult: AuditResult): number | null {
    console.log('🔍 [AUDIT COMPONENT] Recherche de l\'ID de l\'audit SEO...');
    
    // 1. Essayer de récupérer l'ID directement depuis le résultat SEO
    if (seoResult.seoAuditId) {
      console.log('✅ [AUDIT COMPONENT] ID de l\'audit SEO trouvé directement:', seoResult.seoAuditId);
      return seoResult.seoAuditId;
    }
    
    // 2. Essayer de récupérer l'ID depuis les données de l'audit
    const auditData = this.auditResults();
    console.log('📊 [AUDIT COMPONENT] Données d\'audit disponibles:', auditData);
    
    const seoCard = auditData.find(result => result.id === 'seo');
    console.log('🔍 [AUDIT COMPONENT] Carte SEO trouvée:', seoCard);
    
    if (seoCard && seoCard.seoAuditId) {
      console.log('✅ [AUDIT COMPONENT] ID de l\'audit SEO trouvé dans la carte:', seoCard.seoAuditId);
      return seoCard.seoAuditId;
    }
    
    // 3. Essayer de récupérer depuis les données globales de l'audit (depuis le composant)
    // Ces données sont stockées lors de l'audit initial
    const globalAuditData = (this as any).lastAuditData;
    if (globalAuditData && globalAuditData.seoAuditId) {
      console.log('✅ [AUDIT COMPONENT] ID de l\'audit SEO trouvé dans les données globales:', globalAuditData.seoAuditId);
      return globalAuditData.seoAuditId;
    }
    
    // Si pas trouvé, afficher une erreur claire
    console.error('❌ [AUDIT COMPONENT] ID d\'audit SEO non trouvé !');
    console.error('❌ [AUDIT COMPONENT] Vérifiez que l\'audit SEO a bien été lancé avant de cliquer sur "Voir les Détails"');
    console.error('❌ [AUDIT COMPONENT] Données disponibles:', { seoResult, auditData, globalAuditData });
    return null; // Retourner null au lieu d'un ID par défaut
  }

  // Enrichir le résultat SEO avec les détails de l'API
  private enrichSeoResultWithDetails(baseSeoResult: AuditResult, detailedSeoResult: any): AuditResult {
    console.log('🔧 [AUDIT COMPONENT] Enrichissement du résultat SEO avec les détails:', detailedSeoResult);
    
    // Créer une copie du résultat de base
    const enrichedResult = { ...baseSeoResult };
    
    // Enrichir avec les détails de l'API
    if (detailedSeoResult && detailedSeoResult.success) {
      // Mettre à jour le score avec les vraies données de l'API
      if (detailedSeoResult.globalScore !== undefined) {
        enrichedResult.score = detailedSeoResult.globalScore;
        console.log('✅ [AUDIT COMPONENT] Score SEO mis à jour:', baseSeoResult.score, '→', detailedSeoResult.globalScore);
      }
      
      // Mettre à jour le statut basé sur le nouveau score
      enrichedResult.status = this.getStatusFromScore(detailedSeoResult.globalScore);
      console.log('✅ [AUDIT COMPONENT] Statut SEO mis à jour:', baseSeoResult.status, '→', enrichedResult.status);
      
      // Mettre à jour le résumé avec les vraies données de l'API
      if (detailedSeoResult.summary) {
        enrichedResult.summary = detailedSeoResult.summary;
        console.log('✅ [AUDIT COMPONENT] Résumé SEO mis à jour avec les vraies données');
      }
      
      // Ajouter les détails détaillés
      enrichedResult.details = this.formatDetailedSeoResults(detailedSeoResult);
      console.log('✅ [AUDIT COMPONENT] Détails SEO enrichis avec les vraies données de l\'API');
    }
    
    console.log('🔧 [AUDIT COMPONENT] Résultat SEO enrichi final:', enrichedResult);
    return enrichedResult;
  }

  // Formater les résultats SEO détaillés pour l'affichage
  private formatDetailedSeoResults(detailedSeoResult: any): string[] {
    const formattedDetails: string[] = [];
    
    // Score global
    if (detailedSeoResult.globalScore !== undefined) {
      formattedDetails.push(`🎯 Score SEO global : ${detailedSeoResult.globalScore}/100`);
    }
    
    // Détails des vérifications avec statistiques
    if (detailedSeoResult.checkResults && Array.isArray(detailedSeoResult.checkResults)) {
      // Calculer les statistiques
      const passedChecks = detailedSeoResult.checkResults.filter((check: any) => check.status === 'PASSED').length;
      const failedChecks = detailedSeoResult.checkResults.filter((check: any) => check.status === 'FAILED').length;
      const warningChecks = detailedSeoResult.checkResults.filter((check: any) => check.status === 'WARNING').length;
      
      formattedDetails.push('');
      formattedDetails.push(`📊 Statistiques des vérifications :`);
      formattedDetails.push(`✅ Vérifications réussies : ${passedChecks}`);
      formattedDetails.push(`❌ Vérifications échouées : ${failedChecks}`);
      formattedDetails.push(`⚠️ Avertissements : ${warningChecks}`);
      
      formattedDetails.push('');
      formattedDetails.push('🔍 Détails des vérifications SEO :');
      
      detailedSeoResult.checkResults.forEach((check: any, index: number) => {
        const statusIcon = check.status === 'PASSED' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
        const checkName = check.checkType || `Vérification ${index + 1}`;
        const checkScore = check.score !== undefined ? ` (${check.score}/${check.maxScore || 10})` : '';
        
        formattedDetails.push(`${statusIcon} ${checkName}${checkScore}`);
        
        // Ajouter la description si disponible
        if (check.details) {
          formattedDetails.push(`   📝 ${check.details}`);
        }
        
        // Ajouter les problèmes si disponibles
        if (check.issues && check.issues.trim() !== '') {
          formattedDetails.push(`   ⚠️ ${check.issues}`);
        }
      });
    }
    
    // Recommandations
    if (detailedSeoResult.recommendations && Array.isArray(detailedSeoResult.recommendations) && detailedSeoResult.recommendations.length > 0) {
      formattedDetails.push('');
      formattedDetails.push('💡 Recommandations d\'amélioration :');
      
      detailedSeoResult.recommendations.slice(0, 5).forEach((rec: any, index: number) => {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟠' : '🟡';
        formattedDetails.push(`${priorityIcon} ${rec.title || `Recommandation ${index + 1}`}`);
        
        if (rec.description) {
          formattedDetails.push(`   📋 ${rec.description}`);
        }
        
        if (rec.impact) {
          formattedDetails.push(`   🎯 Impact : ${rec.impact}`);
        }
      });
    } else {
      // Si pas de recommandations, en créer basées sur les vérifications échouées
      if (detailedSeoResult.checkResults && Array.isArray(detailedSeoResult.checkResults)) {
        const failedChecks = detailedSeoResult.checkResults.filter((check: any) => check.status === 'FAILED');
        
        if (failedChecks.length > 0) {
          formattedDetails.push('');
          formattedDetails.push('💡 Recommandations d\'amélioration :');
          
          failedChecks.slice(0, 3).forEach((check: any) => {
            const recommendation = this.getSeoRecommendation(check.checkType);
            if (recommendation) {
              formattedDetails.push(`🔴 ${recommendation.title}`);
              formattedDetails.push(`   📋 ${recommendation.description}`);
            }
          });
        }
      }
    }
    
    // Métriques de performance
    if (detailedSeoResult.performanceMetrics) {
      formattedDetails.push('');
      formattedDetails.push('⚡ Métriques de performance :');
      
      Object.entries(detailedSeoResult.performanceMetrics).forEach(([key, value]) => {
        const icon = key.includes('Speed') ? '🚀' : key.includes('Mobile') ? '📱' : '📊';
        formattedDetails.push(`${icon} ${key} : ${value}`);
      });
    }
    
    // Informations techniques
    if (detailedSeoResult.technicalDetails) {
      formattedDetails.push('');
      formattedDetails.push('🔧 Détails techniques :');
      
      Object.entries(detailedSeoResult.technicalDetails).forEach(([key, value]) => {
        formattedDetails.push(`⚙️ ${key} : ${value}`);
      });
    }
    
    // Si pas de détails, ajouter des informations par défaut
    if (formattedDetails.length === 0) {
      formattedDetails.push('📊 Audit SEO détaillé effectué');
      formattedDetails.push('🔍 Vérification complète des éléments SEO');
      formattedDetails.push('📈 Analyse des performances et de la structure');
    }
    
    return formattedDetails;
  }

  // Générer des recommandations SEO basées sur le type de vérification échouée
  private getSeoRecommendation(checkType: string): { title: string; description: string } | null {
    const recommendations: { [key: string]: { title: string; description: string } } = {
      'HTTPS_REDIRECT': {
        title: 'Implémenter la redirection HTTPS',
        description: 'HTTPS améliore la sécurité et le classement SEO.'
      },
      'ROBOTS_TXT': {
        title: 'Ajouter un fichier robots.txt',
        description: 'Le robots.txt guide les moteurs de recherche dans l\'indexation.'
      },
      'IMAGE_ALT_ATTRIBUTES': {
        title: 'Ajouter des attributs alt aux images',
        description: 'Les attributs alt améliorent l\'accessibilité et le SEO des images.'
      },
      'EXTERNAL_LINKS': {
        title: 'Améliorer les liens externes',
        description: 'Ajouter des attributs rel="nofollow" aux liens externes non fiables.'
      },
      'SITEMAP_XML': {
        title: 'Créer un sitemap XML',
        description: 'Le sitemap aide les moteurs de recherche à indexer votre site.'
      },
      'TITLE_TAG': {
        title: 'Optimiser les balises de titre',
        description: 'Les titres doivent être uniques et descriptifs pour chaque page.'
      },
      'INTERNAL_LINKS': {
        title: 'Améliorer la structure des liens internes',
        description: 'Une bonne structure de liens internes améliore la navigation et le SEO.'
      },
      'META_DESCRIPTION': {
        title: 'Ajouter une meta description',
        description: 'La meta description améliore l\'apparence dans les résultats de recherche.'
      },
      'HEADING_HIERARCHY': {
        title: 'Améliorer la hiérarchie des titres',
        description: 'Une bonne hiérarchie H1-H2-H3 améliore la lisibilité et le SEO.'
      }
    };
    
    return recommendations[checkType] || null;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'good': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'critical': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  getScoreBarColor(score: number): string {
    if (score >= 80) return 'progress-success';
    if (score >= 60) return 'progress-warning';
    return 'progress-danger';
  }

  getStatusText(score: number): string {
    if (score >= 80) return 'Score de Sécurité Excellent';
    if (score >= 60) return 'Bonne Sécurité avec Améliorations Nécessaires';
    return 'Problèmes de Sécurité Critiques Détectés';
  }

  getStatusTextColor(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  getStatusCounts() {
    const results = this.auditResults();
    return {
      good: results.filter(r => r.status === 'good').length,
      warning: results.filter(r => r.status === 'warning').length,
      critical: results.filter(r => r.status === 'critical').length
    };
  }

  // MÉTHODE COPIÉE DIRECTEMENT DE liste-sites.component
  ajouterEtAuditer() {
    const url = (this.currentUrl || '').trim();
    if (!url) { 
      alert('Veuillez entrer une URL'); 
      this.isLoading.set(false);
      return; 
    }
    
    const body: any = { url, name: this.extraireNom(url) };
    
    console.log('🚀 [AUDIT COMPONENT] Création du site web:', body);
    
    this.http.post<any>('/api/websites', body).subscribe({
      next: (created) => {
        const siteId = created?.id;
        if (!siteId) { 
          console.error('❌ [AUDIT COMPONENT] Pas d\'ID de site reçu');
          alert('Erreur: Impossible de créer le site web');
          this.isLoading.set(false);
          return; 
        }

        console.log('✅ [AUDIT COMPONENT] Site créé avec ID:', siteId);

        // Lancer l'audit avec le même endpoint que liste-sites.component
        this.http.get(`/api/audits/launch/${siteId}`).subscribe({
          next: (auditResult: any) => {
            console.log('✅ [AUDIT COMPONENT] Audit terminé:', auditResult);
            
            // Conserver l'ID du site et l'auditId pour les appels suivants
            (this as any).lastWebsiteId = siteId;
            if (auditResult && auditResult.auditId) {
              (this as any).lastAuditData = auditResult;
              console.log('💾 [AUDIT COMPONENT] AuditId stocké:', auditResult.auditId);
            }

            // Propager websiteId et auditId dans les résultats combinés
            const auditResultWithIds = { ...auditResult, websiteId: siteId, auditId: auditResult?.auditId };
            
            // Maintenant lancer le scan rapide des vulnérabilités
            this.launchQuickVulnerabilityScan(this.currentUrl, auditResultWithIds);
          },
          error: (err) => {
            const msg = err?.error?.error || err?.error || "Erreur lors du lancement de l'audit";
            console.error('❌ [AUDIT COMPONENT] Erreur audit:', err);
            alert(`❌ Erreur d'audit: ${msg}`);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error || "Impossible d'ajouter le site";
        console.error('❌ [AUDIT COMPONENT] Erreur création site:', err);
        alert(`❌ Erreur: ${msg}`);
        this.isLoading.set(false);
      }
    });
  }

  // MÉTHODE COPIÉE DIRECTEMENT DE liste-sites.component
  private extraireNom(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname;
    } catch {
      return url;
    }
  }

  private convertBackendDataToResults(backendData: any): AuditResult[] {
    console.log('🔄 [AUDIT COMPONENT] Conversion des données backend vers résultats d\'affichage:', backendData);
    
    const results: AuditResult[] = [];

    // 1. SSL Security - Utilise les vraies données du backend
    const sslScore = backendData.sslValid ? 100 : 0;
    const sslStatus = backendData.sslValid ? 'good' : 'critical';
    const sslSummary = backendData.sslValid ? 'Le certificat SSL est valide et correctement configuré.' : 'Problème avec le certificat SSL détecté.';
    
    // Traiter les détails SSL du backend
    let sslDetails: string[] = [];
    if (backendData.sslResult) {
      // Diviser le résultat SSL en lignes et nettoyer
      sslDetails = backendData.sslResult
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          // Nettoyer les émojis et formater
          return line.replace(/^[✅❌•\-\s]+/, '').trim();
        });
    }
    
    if (sslDetails.length === 0) {
      sslDetails = ['Information SSL non disponible'];
    }
    
    results.push({
      id: 'ssl',
      title: 'Certificat SSL',
      icon: this.getSslIcon(),
      score: sslScore,
      status: sslStatus,
      summary: sslSummary,
      details: sslDetails
    });

    // 2. HTTP Headers - Utilise les vraies données du backend
    const headersScore = backendData.httpHeadersScore || 0;
    const headersStatus = this.getStatusFromScore(headersScore);
    
    // Traiter les en-têtes de sécurité du backend
    let headersDetails: string[] = [];
    if (backendData.securityHeaders) {
      headersDetails = Object.entries(backendData.securityHeaders).map(([header, value]) => {
        const status = value === '❌ Non présent' ? '❌ Manquant' : '✅ Présent';
        return `${header}: ${status} - ${value}`;
      });
    }
    
    if (headersDetails.length === 0) {
      headersDetails = ['Aucun en-tête de sécurité détecté'];
    }
    
    results.push({
      id: 'headers',
      title: 'En-têtes HTTP de Sécurité',
      icon: '🛡️',
      score: headersScore,
      status: headersStatus,
      summary: `Score des en-têtes de sécurité : ${headersScore}/100`,
      details: headersDetails
    });

    // 3. JavaScript Libraries - Utilise les vraies données du backend
    const jsScore = backendData.jsSecurityScore || 0;
    const jsStatus = this.getStatusFromScore(jsScore);
    const jsLibrariesCount = backendData.jsLibrariesCount || 0;
    const vulnerableJsCount = backendData.vulnerableJsCount || 0;
    
    // Créer un résumé dynamique basé sur les vraies données
    let jsSummary = '';
    if (jsLibrariesCount === 0) {
      jsSummary = 'Aucune bibliothèque JavaScript détectée';
    } else if (vulnerableJsCount === 0) {
      jsSummary = `${jsLibrariesCount} bibliothèques détectées, toutes sécurisées`;
    } else {
      jsSummary = `${jsLibrariesCount} bibliothèques détectées, ${vulnerableJsCount} vulnérables`;
    }
    
    // Créer des détails dynamiques
    let jsDetails: string[] = [];
    if (jsLibrariesCount > 0) {
      jsDetails.push(`Nombre total de bibliothèques : ${jsLibrariesCount}`);
      jsDetails.push(`Bibliothèques vulnérables : ${vulnerableJsCount}`);
      jsDetails.push(`Score de sécurité JS : ${jsScore}/100`);
      
      if (vulnerableJsCount > 0) {
        jsDetails.push('⚠️ Mise à jour des bibliothèques vulnérables recommandée');
      } else {
        jsDetails.push('✅ Toutes les bibliothèques sont à jour');
      }
    } else {
      jsDetails.push('Aucune bibliothèque JavaScript détectée sur ce site');
    }
    
    results.push({
      id: 'js-libraries',
      title: 'Bibliothèques JavaScript',
      icon: '📚',
      score: jsScore,
      status: jsStatus,
      summary: jsSummary,
      details: jsDetails
    });

    // 4. Web Vulnerabilities - Utilise les vraies données du scanner actif
    const vulnCount = backendData.vulnerabilitiesCount || backendData.activeVulnerabilitiesCount || backendData.activeScanResults?.vulnerabilityCounts?.total || 0;
    const vulnScore = (backendData.globalScore ?? backendData.activeScanResults?.globalScore ?? (vulnCount > 0 ? Math.max(50, 100 - vulnCount * 10) : 100));
    const vulnStatus = vulnCount > 3 ? 'critical' : vulnCount > 1 ? 'warning' : 'good';
    
    // Créer un résumé dynamique basé sur les vraies données du scanner
    let vulnSummary = '';
    if (vulnCount === 0) {
      vulnSummary = 'Aucune vulnérabilité web détectée par le scanner actif';
    } else if (vulnCount === 1) {
      vulnSummary = '1 vulnérabilité web détectée par le scanner actif';
    } else {
      vulnSummary = `${vulnCount} vulnérabilités web détectées par le scanner actif`;
    }
    
    // Créer des détails dynamiques basés sur les vraies données du scanner
    let vulnDetails: string[] = [];
    if (vulnCount === 0) {
      vulnDetails.push('✅ Aucune vulnérabilité critique détectée');
      vulnDetails.push('✅ Protection XSS en place');
      vulnDetails.push('✅ Protection CSRF implémentée');
      vulnDetails.push('✅ Validation des entrées sécurisée');
      vulnDetails.push('🔍 Scanner actif : Aucune vulnérabilité trouvée');
    } else {
      vulnDetails.push(`🚨 ${vulnCount} vulnérabilité(s) détectée(s) par le scanner actif`);
      if (vulnCount > 3) {
        vulnDetails.push('❌ Attention immédiate requise');
        vulnDetails.push('⚠️ Vérification de sécurité urgente');
        vulnDetails.push('🔍 Scanner actif : Vulnérabilités critiques identifiées');
      } else if (vulnCount > 1) {
        vulnDetails.push('⚠️ Améliorations de sécurité recommandées');
        vulnDetails.push('🔍 Audit de sécurité détaillé nécessaire');
        vulnDetails.push('🔍 Scanner actif : Vulnérabilités modérées identifiées');
      } else {
        vulnDetails.push('⚠️ Vulnérabilité mineure détectée');
        vulnDetails.push('🔧 Correction recommandée');
        vulnDetails.push('🔍 Scanner actif : Vulnérabilité mineure identifiée');
      }
    }
    
    results.push({
      id: 'web-vulnerabilities',
      title: 'Vulnérabilités Web',
      icon: '🚨',
      score: vulnScore,
      status: vulnStatus,
      summary: vulnSummary,
      details: vulnDetails
    });

    // 5. Cookies & Sessions - Utilise les vraies données du backend
    const cookieScore = backendData.cookieScore || 0;
    const cookieStatus = cookieScore >= 80 ? 'good' : cookieScore >= 60 ? 'warning' : 'critical';
    const cookieSummary = cookieScore >= 80 ? 
      'Configuration des cookies sécurisée avec les bons paramètres.' :
      cookieScore >= 60 ? 
      'Configuration des cookies acceptable avec quelques améliorations possibles.' :
      'Configuration des cookies nécessite des améliorations importantes.';
    
    // Traiter les détails des cookies du backend
    let cookieDetails: string[] = [];
    if (backendData.cookieDetails && backendData.cookieDetails.cookies) {
      const cookies = backendData.cookieDetails.cookies;
      if (cookies.length > 0) {
        cookieDetails.push(`Total des cookies détectés: ${cookies.length}`);
        cookies.forEach((cookie: any, index: number) => {
          if (index < 3) { // Limiter à 3 cookies pour l'affichage
            cookieDetails.push(`Cookie: ${cookie.name || 'Non nommé'}`);
          }
        });
      } else {
        cookieDetails.push('Aucun cookie détecté sur ce site');
      }
    }
    
    if (backendData.sessionDetails) {
      const sessionIssues = backendData.sessionDetails.totalIssues || 0;
      if (sessionIssues === 0) {
        cookieDetails.push('Aucun problème de session détecté');
      } else {
        cookieDetails.push(`${sessionIssues} problème(s) de session détecté(s)`);
      }
    }
    
    if (backendData.totalIssues !== undefined) {
      cookieDetails.push(`Total des problèmes: ${backendData.totalIssues}`);
    }
    
    // Si pas de détails spécifiques, utiliser des détails par défaut
    if (cookieDetails.length === 0) {
      cookieDetails = [
        'Analyse des cookies et sessions terminée',
        `Score de sécurité: ${cookieScore}/100`,
        'Vérification des attributs de sécurité des cookies'
      ];
    }
    
    results.push({
      id: 'cookies',
      title: 'Cookies et Sessions',
      icon: '🍪',
      score: cookieScore,
      status: cookieStatus,
      summary: cookieSummary,
      details: cookieDetails
    });

    // 6bis. Audit des Dépendances - Utilise les vraies données du backend
    const depData = backendData.dependencyDetails || backendData.dependencyAuditResult || {};
    // Utiliser la valeur du backend si dependencyScore n'est pas présent dans l'objet principal
    const dependencyScore = (backendData.dependencyScore ?? depData.globalScore ?? 0);
    const dependencyStatus = dependencyScore >= 80 ? 'good' : dependencyScore >= 60 ? 'warning' : 'critical';

    let dependencySummary = '';
    if (dependencyScore >= 80) {
      dependencySummary = 'Dépendances globalement saines.';
    } else if (dependencyScore >= 60) {
      dependencySummary = 'Dépendances acceptables avec quelques améliorations possibles.';
    } else {
      dependencySummary = 'Dépendances nécessitent des améliorations importantes.';
    }

    // Détails des dépendances
    const dependencyDetails: string[] = [];
    if (depData) {
      const depStats = depData.statistics || depData;
      const totalDeps = depStats.totalDependencies || 0;
      const vulnDeps = depStats.vulnerableDependencies || depStats.vulnerableCount || 0;
      const crit = depStats.criticalVulnerabilities || depStats.criticalCount || 0;
      const high = depStats.highVulnerabilities || depStats.highCount || 0;
      const medium = depStats.mediumVulnerabilities || depStats.mediumCount || 0;
      const low = depStats.lowVulnerabilities || depStats.lowCount || 0;

      dependencyDetails.push(`📦 Total des dépendances: ${totalDeps}`);
      dependencyDetails.push(`🚨 Dépendances vulnérables: ${vulnDeps}`);
      dependencyDetails.push(`🔴 Critiques: ${crit} | 🟠 Élevées: ${high} | 🟡 Moyennes: ${medium} | 🟢 Faibles: ${low}`);

      if (Array.isArray(depData.vulnerabilities) && depData.vulnerabilities.length > 0) {
        const top = depData.vulnerabilities.slice(0, 3);
        dependencyDetails.push('Vulnérabilités principales:');
        top.forEach((v: any) => {
          dependencyDetails.push(`- ${v.dependencyName || v.artifactId || 'Dépendance'} (${v.cve || 'CVE N/A'}) - ${v.severity || 'N/A'}`);
        });
      }

      if (typeof depData.globalScore === 'number') {
        dependencyDetails.push(`🎯 Score global: ${depData.globalScore}/100`);
      }
    }

    results.push({
      id: 'dependencies',
      title: 'Audit des Dépendances',
      icon: '📦',
      score: dependencyScore,
      status: dependencyStatus as any,
      summary: dependencySummary,
      details: dependencyDetails.length ? dependencyDetails : ['Aucun détail de dépendances disponible']
    });

    // 7. Backend Libraries - Utilise les vraies données du backend
    const backendScore = backendData.backendLibrariesScore || 0;
    const backendStatus = this.getStatusFromScore(backendScore);
    
    // Créer un résumé dynamique basé sur les vraies données
    let backendSummary = '';
    if (backendScore >= 80) {
      backendSummary = 'Les bibliothèques backend sont sécurisées et à jour.';
    } else if (backendScore >= 60) {
      backendSummary = 'Les bibliothèques backend sont généralement sécurisées avec quelques mises à jour recommandées.';
    } else {
      backendSummary = 'Les bibliothèques backend nécessitent des mises à jour importantes pour la sécurité.';
    }
    
    // Créer des détails dynamiques basés sur les vraies données
    let backendDetails: string[] = [];
    if (backendData.backendLibrariesDetails) {
      const details = backendData.backendLibrariesDetails;
      
      if (details.backendLibrariesMessage) {
        backendDetails.push(`Statut: ${details.backendLibrariesMessage}`);
      }
      
      if (details.backendLibrariesStatus) {
        backendDetails.push(`État: ${details.backendLibrariesStatus}`);
      }
      
      backendDetails.push(`Score de sécurité: ${backendScore}/100`);
      
      // Ajouter des détails spécifiques si disponibles
      if (details.detectedTechnologies) {
        backendDetails.push(`Technologies détectées: ${details.detectedTechnologies.join(', ')}`);
      }
      
      if (details.securityIssues && details.securityIssues.length > 0) {
        backendDetails.push(`Problèmes de sécurité: ${details.securityIssues.length}`);
        details.securityIssues.slice(0, 3).forEach((issue: any) => {
          backendDetails.push(`- ${issue.description || issue}`);
        });
      }
      
      if (details.recommendations && details.recommendations.length > 0) {
        backendDetails.push('Recommandations:');
        details.recommendations.slice(0, 3).forEach((rec: any) => {
          backendDetails.push(`- ${rec.description || rec}`);
        });
      }
    }
    
    // Si pas de détails spécifiques, utiliser des détails par défaut
    if (backendDetails.length === 0) {
      backendDetails = [
        'Analyse des bibliothèques backend terminée',
        `Score de sécurité: ${backendScore}/100`,
        'Vérification des versions et vulnérabilités des bibliothèques backend'
      ];
    }
    
    results.push({
      id: 'backend-scan',
      title: 'Bibliothèques Backend',
      icon: '⚙️',
      score: backendScore,
      status: backendStatus as any,
      summary: backendSummary,
      details: backendDetails
    });

    // 8. SEO Audit - Utilise les vraies données du backend
    console.log('📊 [AUDIT COMPONENT] Traitement des données SEO:', {
      seoScore: backendData.seoScore,
      seoDetails: backendData.seoDetails,
      seoRecommendations: backendData.seoRecommendations,
      seoAuditId: backendData.seoAuditId
    });
    
    const seoScore = backendData.seoScore || 0;
    const seoStatus = this.getStatusFromScore(seoScore);
    
    // Créer un résumé dynamique basé sur les vraies données SEO
    let seoSummary = '';
    if (seoScore >= 80) {
      seoSummary = 'L\'implémentation SEO est solide avec des opportunités d\'optimisation mineures.';
    } else if (seoScore >= 60) {
      seoSummary = 'Bonne base SEO avec quelques améliorations possibles.';
    } else if (seoScore >= 40) {
      seoSummary = 'Le site a besoin d\'améliorations SEO importantes.';
    } else {
      seoSummary = 'Le site nécessite une optimisation SEO urgente.';
    }
    
    // Créer des détails dynamiques basés sur les vraies données SEO
    let seoDetails: string[] = [];
    
    // Ajouter le score SEO principal
    seoDetails.push(`Score SEO global : ${seoScore}/100`);
    
    // Si on a des détails SEO détaillés
    if (backendData.seoDetails && Array.isArray(backendData.seoDetails) && backendData.seoDetails.length > 0) {
      // Compter les vérifications par statut
      const passedChecks = backendData.seoDetails.filter((check: any) => check.status === 'PASSED').length;
      const failedChecks = backendData.seoDetails.filter((check: any) => check.status === 'FAILED').length;
      const warningChecks = backendData.seoDetails.filter((check: any) => check.status === 'WARNING').length;
      
      seoDetails.push(`✅ Vérifications réussies : ${passedChecks}`);
      seoDetails.push(`❌ Vérifications échouées : ${failedChecks}`);
      seoDetails.push(`⚠️ Avertissements : ${warningChecks}`);
      
      // Ajouter des détails spécifiques des vérifications
      seoDetails.push('');
      seoDetails.push('🔍 Détails des vérifications :');
      backendData.seoDetails.forEach((check: any, index: number) => {
        const statusIcon = check.status === 'PASSED' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
        seoDetails.push(`${statusIcon} ${check.checkType}: ${check.score}/${check.maxScore}`);
      });
    }
    
    // Ajouter des recommandations SEO si disponibles
    if (backendData.seoRecommendations && Array.isArray(backendData.seoRecommendations) && backendData.seoRecommendations.length > 0) {
      seoDetails.push('');
      seoDetails.push('💡 Recommandations SEO :');
      backendData.seoRecommendations.slice(0, 3).forEach((rec: any, index: number) => {
        const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟠' : '🟡';
        seoDetails.push(`${priorityIcon} ${rec.title}`);
        seoDetails.push(`   ${rec.description}`);
      });
    }
    
    // Si on a un ID d'audit SEO, l'ajouter
    if (backendData.seoAuditId) {
      seoDetails.push('');
      seoDetails.push(`🆔 ID de l'audit SEO : ${backendData.seoAuditId}`);
    }
    
    // Si pas de données SEO détaillées, utiliser des détails par défaut
    if (seoDetails.length <= 2) { // Seulement le score et l'ID
      seoDetails.push('');
      seoDetails.push('📋 Audit SEO basique effectué');
      seoDetails.push('🔍 Vérification des éléments SEO essentiels');
      seoDetails.push('📊 Score calculé sur la base des critères principaux');
    }
    
              results.push({
            id: 'seo',
            title: 'Audit SEO',
            icon: '📊',
            score: seoScore,
            status: seoStatus,
            summary: seoSummary,
            details: seoDetails,
            // Conserver l'ID de l'audit SEO pour pouvoir récupérer les détails plus tard
            seoAuditId: backendData.seoAuditId
          });

    return results;
  }

  private getStatusFromScore(score: number): 'good' | 'warning' | 'critical' {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  }

  // Formater les détails du scan complet des vulnérabilités
  private formatFullScanDetails(scanResult: any): string[] {
    const details: string[] = [];
    
    // === RÉSUMÉ GLOBAL ===
    details.push('🔍 RÉSUMÉ DU SCAN COMPLET');
    details.push('========================');
    
    if (scanResult.totalVulnerabilities !== undefined) {
      details.push(`📊 Total des vulnérabilités : ${scanResult.totalVulnerabilities}`);
    }
    
    if (scanResult.scannedPages) {
      details.push(`📄 Pages scannées : ${scanResult.scannedPages}`);
    }
    
    if (scanResult.websiteUrl) {
      details.push(`🌐 Site analysé : ${scanResult.websiteUrl}`);
    }
    
    // === STATISTIQUES PAR TYPE ===
    if (scanResult.vulnerabilityCounts) {
      details.push('');
      details.push('📈 RÉPARTITION PAR TYPE');
      details.push('=======================');
      
      const counts = scanResult.vulnerabilityCounts;
      if (counts.sqlInjection !== undefined) {
        details.push(`💉 Injection SQL : ${counts.sqlInjection} vulnérabilités`);
      }
      if (counts.xss !== undefined) {
        details.push(`🕷️  XSS (Cross-Site Scripting) : ${counts.xss} vulnérabilités`);
      }
      if (counts.csrf !== undefined) {
        details.push(`🔒 CSRF (Cross-Site Request Forgery) : ${counts.csrf} vulnérabilités`);
      }
      if (counts.total !== undefined) {
        details.push(`📊 Total général : ${counts.total} vulnérabilités`);
      }
    }
    
    // === VULNÉRABILITÉS DÉTAILLÉES ===
    if (scanResult.vulnerabilities && Array.isArray(scanResult.vulnerabilities)) {
      details.push('');
      details.push('🚨 VULNÉRABILITÉS DÉTECTÉES');
      details.push('=============================');
      
      // Grouper par type de vulnérabilité
      const vulnByType: { [key: string]: any[] } = {};
      scanResult.vulnerabilities.forEach((vuln: any) => {
        const type = vuln.type || 'AUTRES';
        if (!vulnByType[type]) {
          vulnByType[type] = [];
        }
        vulnByType[type].push(vuln);
      });
      
      // Afficher par type
      Object.entries(vulnByType).forEach(([type, vulns]) => {
        const typeLabel = this.getVulnerabilityTypeLabel(type);
        const severityIcon = this.getSeverityIcon(vulns[0]?.severity);
        
        details.push('');
        details.push(`${severityIcon} ${typeLabel.toUpperCase()} (${vulns.length} vulnérabilités)`);
        details.push('─'.repeat(typeLabel.length + 20));
        
        vulns.forEach((vuln: any, index: number) => {
          details.push(`  ${index + 1}. ${vuln.title}`);
          
          if (vuln.severity) {
            const severity = vuln.severity.toLowerCase();
            const severityColor = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
            details.push(`     ${severityColor} Sévérité : ${vuln.severity}`);
          }
          
          if (vuln.context) {
            details.push(`     📍 Contexte : ${vuln.context}`);
          }
          
          if (vuln.url) {
            details.push(`     🔗 URL : ${vuln.url}`);
          }
          
          if (vuln.payload) {
            details.push(`     💣 Payload : ${vuln.payload}`);
          }
          
          if (vuln.description) {
            details.push(`     📝 Description : ${vuln.description}`);
          }
          
          if (vuln.timestamp) {
            const date = new Date(vuln.timestamp);
            const formattedDate = date.toLocaleString('fr-FR');
            details.push(`     ⏰ Détecté le : ${formattedDate}`);
          }
          
          details.push(''); // Séparateur entre vulnérabilités
        });
      });
    }
    
    // === RECOMMANDATIONS ===
    details.push('');
    details.push('💡 RECOMMANDATIONS DE SÉCURITÉ');
    details.push('===============================');
    
    if (scanResult.totalVulnerabilities > 0) {
      if (scanResult.vulnerabilityCounts?.sqlInjection > 0) {
        details.push('🔴 Injection SQL : Implémenter une validation stricte des entrées et utiliser des requêtes préparées');
      }
      if (scanResult.vulnerabilityCounts?.xss > 0) {
        details.push('🟠 XSS : Encoder toutes les sorties utilisateur et implémenter une politique CSP stricte');
      }
      if (scanResult.vulnerabilityCounts?.csrf > 0) {
        details.push('🟡 CSRF : Ajouter des tokens CSRF à tous les formulaires sensibles');
      }
      details.push('📋 Effectuer un audit de sécurité complet et corriger toutes les vulnérabilités détectées');
    } else {
      details.push('✅ Aucune vulnérabilité critique détectée - Site sécurisé !');
    }
    
    if (details.length === 0) {
      details.push('❌ Aucun détail disponible pour ce scan');
    }
    
    return details;
  }
  
  // Obtenir le label français pour le type de vulnérabilité
  private getVulnerabilityTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'SQL_INJECTION': 'Injection SQL',
      'XSS': 'Cross-Site Scripting (XSS)',
      'CSRF': 'Cross-Site Request Forgery (CSRF)',
      'AUTRES': 'Autres vulnérabilités'
    };
    return labels[type] || type;
  }
  
  // Obtenir l'icône de sévérité
  private getSeverityIcon(severity: string): string {
    if (!severity) return '❓';
    const sev = severity.toLowerCase();
    if (sev === 'critical') return '🔴';
    if (sev === 'high') return '🟠';
    if (sev === 'medium') return '🟡';
    if (sev === 'low') return '🟢';
    return '❓';
  }
  
  // Vérifier si on a un scan en cache valide pour une URL
  private getCachedVulnerabilityScan(url: string): any | null {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Vérifier le cache principal
    if (this.vulnerabilityScanCache.has(normalizedUrl)) {
      const cachedData = this.vulnerabilityScanCache.get(normalizedUrl);
      if (this.isCacheValid(cachedData)) {
        console.log('✅ [AUDIT COMPONENT] Cache valide trouvé pour:', normalizedUrl);
        return cachedData;
      } else {
        console.log('⏰ [AUDIT COMPONENT] Cache expiré pour:', normalizedUrl);
        this.vulnerabilityScanCache.delete(normalizedUrl);
      }
    }
    
    // Vérifier l'historique des scans
    if (this.scanHistory.has(normalizedUrl)) {
      const historyEntry = this.scanHistory.get(normalizedUrl);
      if (historyEntry && this.isCacheValid(historyEntry)) {
        console.log('✅ [AUDIT COMPONENT] Historique valide trouvé pour:', normalizedUrl);
        // Mettre à jour le cache principal
        this.vulnerabilityScanCache.set(normalizedUrl, historyEntry.data);
        return historyEntry.data;
      } else {
        console.log('⏰ [AUDIT COMPONENT] Historique expiré pour:', normalizedUrl);
        this.scanHistory.delete(normalizedUrl);
      }
    }
    
    return null;
  }
  
  // Normaliser une URL pour la comparaison
  private normalizeUrl(url: string): string {
    return url.trim().toLowerCase().replace(/\/$/, '');
  }
  
  // Vérifier si le cache est encore valide
  private isCacheValid(cachedData: any): boolean {
    if (!cachedData || !cachedData.timestamp) return false;
    
    const now = Date.now();
    const cacheAge = now - cachedData.timestamp;
    
    return cacheAge < this.CACHE_VALIDITY_DURATION;
  }
  
  // Afficher les résultats des vulnérabilités (depuis le cache ou nouveau scan)
  private displayVulnerabilityResults(scanResult: any, fromCache: boolean = false) {
    console.log('📊 [AUDIT COMPONENT] Affichage des résultats des vulnérabilités (cache:', fromCache, ')');
    
    if (scanResult && (scanResult.success || scanResult.totalVulnerabilities !== undefined)) {
      const vulnCount = scanResult.totalVulnerabilities || scanResult.activeVulnerabilitiesCount || scanResult.activeScanResults?.vulnerabilityCounts?.total || 0;
      const score = (scanResult.globalScore ?? scanResult.activeScanResults?.globalScore ?? (vulnCount > 0 ? Math.max(30, 100 - vulnCount * 2) : 100));
      const status = vulnCount > 10 ? 'critical' : vulnCount > 5 ? 'warning' : 'good';
      
      const fullVulnResult: AuditResult = {
        id: 'web-vulnerabilities-full',
        title: `🔍 Scan des Vulnérabilités - ${scanResult.websiteUrl || 'Site Web'} ${fromCache ? '(Cache)' : ''}`,
        icon: '🚨',
        score: score,
        status: status,
        summary: this.generateVulnerabilitySummary(scanResult),
        details: this.formatFullScanDetails(scanResult)
      };
      
      this.selectedResult.set(fullVulnResult);
      this.showModal.set(true);
      
      // Mettre en cache ce résultat pour cette URL
      if (scanResult.websiteUrl) {
        this.cacheVulnerabilityScan(scanResult.websiteUrl, scanResult);
      }
    } else {
      console.warn('⚠️ [AUDIT COMPONENT] Résultat de vulnérabilités non valide:', scanResult);
      alert('⚠️ Impossible d\'afficher les détails des vulnérabilités.');
    }
  }
  
  // Mettre en cache les résultats d'un scan de vulnérabilités
  private cacheVulnerabilityScan(url: string, scanResult: any) {
    if (!scanResult || !scanResult.websiteUrl) return;
    
    const normalizedUrl = this.normalizeUrl(scanResult.websiteUrl);
    const cacheEntry = {
      ...scanResult,
      timestamp: Date.now()
    };
    
    // Mettre à jour le cache principal
    this.vulnerabilityScanCache.set(normalizedUrl, cacheEntry);
    
    // Mettre à jour l'historique
    this.scanHistory.set(normalizedUrl, {
      data: scanResult,
      timestamp: Date.now(),
      url: scanResult.websiteUrl
    });
    
    console.log('💾 [AUDIT COMPONENT] Scan mis en cache pour:', normalizedUrl);
    
    // Nettoyer le cache si il devient trop volumineux (garder max 20 entrées)
    if (this.vulnerabilityScanCache.size > 20) {
      this.cleanupCache();
    }
  }
  
  // Nettoyer le cache des entrées expirées
  private cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Nettoyer le cache principal
    for (const [url, data] of this.vulnerabilityScanCache.entries()) {
      if (!this.isCacheValid(data)) {
        this.vulnerabilityScanCache.delete(url);
        cleanedCount++;
      }
    }
    
    // Nettoyer l'historique
    for (const [url, entry] of this.scanHistory.entries()) {
      if (!this.isCacheValid(entry)) {
        this.scanHistory.delete(url);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 [AUDIT COMPONENT] Cache nettoyé: ${cleanedCount} entrées expirées supprimées`);
    }
  }
  
  // Afficher les informations du cache (pour le débogage)
  public showCacheInfo() {
    const cacheSize = this.vulnerabilityScanCache.size;
    const historySize = this.scanHistory.size;
    const now = Date.now();
    
    let cacheInfo = `📋 INFORMATIONS DU CACHE\n`;
    cacheInfo += `========================\n\n`;
    cacheInfo += `Cache principal : ${cacheSize} entrées\n`;
    cacheInfo += `Historique : ${historySize} entrées\n`;
    cacheInfo += `Durée de validité : ${this.CACHE_VALIDITY_DURATION / 60000} minutes\n\n`;
    
    if (cacheSize > 0) {
      cacheInfo += `🔍 ENTRIES EN CACHE :\n`;
      cacheInfo += `─────────────────────\n`;
      
      for (const [url, data] of this.vulnerabilityScanCache.entries()) {
        const age = Math.round((now - data.timestamp) / 60000);
        const validity = this.isCacheValid(data) ? '✅ Valide' : '⏰ Expiré';
        cacheInfo += `${url}\n`;
        cacheInfo += `  Âge : ${age} minutes\n`;
        cacheInfo += `  Statut : ${validity}\n`;
        cacheInfo += `  Vulnérabilités : ${data.totalVulnerabilities || 0}\n\n`;
      }
    }
    
    console.log(cacheInfo);
    alert(cacheInfo);
  }
  
  // Vider complètement le cache
  public clearCache() {
    const cacheSize = this.vulnerabilityScanCache.size;
    const historySize = this.scanHistory.size;
    
    this.vulnerabilityScanCache.clear();
    this.scanHistory.clear();
    
    console.log(`🗑️ [AUDIT COMPONENT] Cache complètement vidé (${cacheSize} entrées cache, ${historySize} entrées historique)`);
    alert(`🗑️ Cache vidé avec succès !\n\nCache principal : ${cacheSize} entrées supprimées\nHistorique : ${historySize} entrées supprimées`);
  }
  
  // Générer un résumé des vulnérabilités
  private generateVulnerabilitySummary(scanResult: any): string {
    const totalVulns = scanResult.totalVulnerabilities || 0;
    const counts = scanResult.vulnerabilityCounts || {};
    
    if (totalVulns === 0) {
      return '✅ Aucune vulnérabilité détectée - Site sécurisé !';
    }
    
    let summary = `🚨 ${totalVulns} vulnérabilité(s) détectée(s)`;
    const parts: string[] = [];
    if (counts.critical) parts.push(`🔴 Critiques: ${counts.critical}`);
    if (counts.high) parts.push(`🟠 Élevées: ${counts.high}`);
    if (counts.medium) parts.push(`🟡 Moyennes: ${counts.medium}`);
    if (counts.low) parts.push(`🟢 Faibles: ${counts.low}`);
    if (parts.length) summary += ` (${parts.join(' | ')})`;
    return summary;
  }
}