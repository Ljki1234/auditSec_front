import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatCard {
  id: string;
  title: string;
  value: number;
  trend: number;
  icon: string;
  svgIcon?: SafeHtml;
  color: string;
}

interface ModuleCard {
  id: string;
  title: string;
  frenchTitle: string;
  description: string;
  icon: string;
  svgIcon?: SafeHtml;
  color: string;
}

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Dashboard Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="dashboard-title">Tableau de Bord d'Audit de Sécurité</h1>
            <p class="dashboard-subtitle">Surveillance et gestion complète des audits de sécurité</p>
          </div>
        </div>
      </header>

      <!-- Statistics Cards -->
      <section class="stats-section">
        <div class="stats-grid">
          <div 
            *ngFor="let stat of statsCards; let i = index"
            class="stat-card"
            [style.animation-delay]="(i * 100) + 'ms'"
          >
            <div class="stat-icon" [style.color]="stat.color">
              <i *ngIf="!stat.svgIcon" [class]="stat.icon"></i>
              <div *ngIf="stat.svgIcon" [innerHTML]="stat.svgIcon" class="svg-icon"></div>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(stat.value) }}</div>
              <div class="stat-trend" [class.positive]="stat.trend > 0" [class.negative]="stat.trend < 0">
                <i class="fas" [class.fa-arrow-up]="stat.trend > 0" [class.fa-arrow-down]="stat.trend < 0"></i>
                {{ Math.abs(stat.trend) }}%
              </div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="charts-grid">
          <div class="chart-card">
            <h3 class="chart-title">Audits par Mois</h3>
            <div class="chart-container">
              <canvas #barChart></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Types de Vulnérabilités</h3>
            <div class="chart-container">
              <canvas #donutChart></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- Modules Overview -->
      <section class="modules-section">
        <h2 class="section-title">Modules de Sécurité</h2>
        <div class="modules-grid">
          <div 
            *ngFor="let module of moduleCards; let i = index"
            class="module-card"
            [style.animation-delay]="(i * 150) + 'ms'"
            (click)="onModuleClick(module)"
          >
            <div class="module-icon" [style.color]="module.color">
              <i *ngIf="!module.svgIcon" [class]="module.icon"></i>
              <div *ngIf="module.svgIcon" [innerHTML]="module.svgIcon" class="svg-icon"></div>
            </div>
            <div class="module-content">
              <h3 class="module-title">{{ module.title }}</h3>
              <p class="module-french-title">{{ module.frenchTitle }}</p>
              <p class="module-description">{{ module.description }}</p>
            </div>
            <div class="module-footer">
              <button class="module-button" [style.background-color]="module.color">
                Voir les Détails
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .dashboard-container {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    /* Header Styles */
    .dashboard-header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    .dashboard-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
      pointer-events: none;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .header-text {
      flex: 1;
    }

    .dashboard-title {
      font-size: 2.25rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      animation: slideDown 0.8s ease-out;
    }

    .dashboard-subtitle {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      animation: slideUp 0.8s ease-out 0.2s both;
    }


    /* Statistics Section */
    .stats-section {
      max-width: 1400px;
      margin: -1rem auto 3rem;
      padding: 0 2rem;
      position: relative;
      z-index: 2;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out both;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      background: var(--primary-light);
      flex-shrink: 0;
    }

    .svg-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .svg-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-trend {
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .stat-trend.positive {
      color: var(--success-color);
    }

    .stat-trend.negative {
      color: var(--error-color);
    }

    .stat-title {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Charts Section */
    .charts-section {
      max-width: 1400px;
      margin: 0 auto 3rem;
      padding: 0 2rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .chart-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      animation: fadeInUp 0.6s ease-out 0.4s both;
    }

    .chart-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-headings);
      margin: 0 0 1.5rem;
    }

    .chart-container {
      position: relative;
      height: 300px;
    }

    /* Modules Section */
    .modules-section {
      max-width: 1400px;
      margin: 0 auto 3rem;
      padding: 0 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-headings);
      margin: 0 0 2rem;
      text-align: center;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }

    .module-card {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      animation: fadeInUp 0.6s ease-out both;
    }

    .module-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .module-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: var(--shadow-lg);
    }

    .module-card:hover::before {
      opacity: 1;
    }

    .module-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      background: var(--primary-light);
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    .module-card:hover .module-icon {
      transform: scale(1.1);
      background: var(--primary-color);
      color: white;
    }

    .module-content {
      margin-bottom: 2rem;
    }

    .module-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
      line-height: 1.3;
    }

    .module-french-title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
      margin: 0 0 1rem;
      font-style: italic;
    }

    .module-description {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    .module-footer {
      display: flex;
      justify-content: flex-end;
    }

    .module-button {
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .module-button:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .module-button i {
      transition: transform 0.3s ease;
    }

    .module-button:hover i {
      transform: translateX(4px);
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .chart-container {
        height: 250px;
      }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        padding: 1.5rem 1rem;
      }
      
      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .dashboard-title {
        font-size: 1.875rem;
      }
      
      .stats-section,
      .charts-section,
      .modules-section {
        padding: 0 1rem;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .modules-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .module-card {
        padding: 1.5rem;
      }
      
      .chart-container {
        height: 200px;
      }
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
  `]
})
export class AdministrationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart', { static: false }) donutChartRef!: ElementRef<HTMLCanvasElement>;

  barChart: Chart | null = null;
  donutChart: Chart | null = null;
  Math = Math;
  statsCards: StatCard[] = [];

  moduleCards: ModuleCard[] = [
    {
      id: 'website-management',
      title: 'Gestion des Sites Web',
      frenchTitle: 'Gestion des Sites',
      description: 'Gérez et surveillez votre portefeuille de sites web avec des outils de supervision complets et des analyses.',
      icon: 'fas fa-globe',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/></svg>'),
      color: '#1A73E8'
    },
    {
      id: 'manual-audit',
      title: 'Audit Manuel',
      frenchTitle: 'Audit manuel',
      description: 'Effectuez des évaluations de sécurité manuelles approfondies avec des rapports détaillés et des recommandations.',
      icon: 'fas fa-search',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/></svg>'),
      color: '#03A9F4'
    },
    {
      id: 'automatic-audit',
      title: 'Audit Automatique',
      frenchTitle: 'Audit automatique',
      description: 'Analyse de sécurité automatisée et évaluation des vulnérabilités avec surveillance en temps réel.',
      icon: 'fas fa-robot',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/></svg>'),
      color: '#1A73E8'
    },
    {
      id: 'compliance-data',
      title: 'Conformité et Données',
      frenchTitle: 'Conformité et données',
      description: 'Assurez la conformité réglementaire et gérez efficacement les exigences de protection des données.',
      icon: 'fas fa-shield-alt',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/></svg>'),
      color: '#03A9F4'
    },
    {
      id: 'organizational-audit',
      title: 'Audit de Sécurité Organisationnel',
      frenchTitle: 'Audit organisationnel',
      description: 'Évaluez les politiques de sécurité organisationnelles, les procédures et la sensibilisation à la sécurité des employés.',
      icon: 'fas fa-users-cog',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/></svg>'),
      color: '#1A73E8'
    },
    {
      id: 'performance-audit',
      title: 'Audit de Performance et Disponibilité',
      frenchTitle: 'Audit de Performance & Disponibilité',
      description: 'Surveillez les performances du système, le temps de fonctionnement et les métriques de disponibilité avec des analyses détaillées.',
      icon: 'fas fa-chart-line',
      svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M434.8 54.1C446.7 62.7 451.1 78.3 445.7 91.9L367.3 288L512 288C525.5 288 537.5 296.4 542.1 309.1C546.7 321.8 542.8 336 532.5 344.6L244.5 584.6C233.2 594 217.1 594.5 205.2 585.9C193.3 577.3 188.9 561.7 194.3 548.1L272.7 352L128 352C114.5 352 102.5 343.6 97.9 330.9C93.3 318.2 97.2 304 107.5 295.4L395.5 55.4C406.8 46 422.9 45.5 434.8 54.1z"/></svg>'),
      color: '#03A9F4'
    }
  ];

  constructor(private sanitizer: DomSanitizer, private router: Router) {
    this.statsCards = [
      {
        id: 'websites',
        title: 'Sites Web Surveillés',
        value: 247,
        trend: 12.5,
        icon: 'fas fa-globe',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/></svg>'),
        color: '#1A73E8'
      },
      {
        id: 'manual-audits',
        title: 'Audits Manuels',
        value: 1834,
        trend: 8.2,
        icon: 'fas fa-search',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/></svg>'),
        color: '#03A9F4'
      },
      {
        id: 'auto-audits',
        title: 'Audits Automatiques',
        value: 12567,
        trend: 15.7,
        icon: 'fas fa-robot',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/></svg>'),
        color: '#1A73E8'
      },
      {
        id: 'vulnerabilities',
        title: 'Vulnérabilités Détectées',
        value: 892,
        trend: -5.3,
        icon: 'fas fa-bug',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 64C334.7 64 348.2 72.1 355.2 85L571.2 485C577.9 497.4 577.6 512.4 570.4 524.5C563.2 536.6 550.1 544 536 544L104 544C89.9 544 76.8 536.6 69.6 524.5C62.4 512.4 62.1 497.4 68.8 485L284.8 85C291.8 72.1 305.3 64 320 64zM320 416C302.3 416 288 430.3 288 448C288 465.7 302.3 480 320 480C337.7 480 352 465.7 352 448C352 430.3 337.7 416 320 416zM320 224C301.8 224 287.3 239.5 288.6 257.7L296 361.7C296.9 374.2 307.4 384 319.9 384C332.5 384 342.9 374.3 343.8 361.7L351.2 257.7C352.5 239.5 338.1 224 319.8 224z"/></svg>'),
        color: '#ef4444'
      },
      {
        id: 'critical-alerts',
        title: 'Alertes Critiques',
        value: 23,
        trend: -18.2,
        icon: 'fas fa-exclamation-triangle',
        svgIcon: this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M525.2 82.9C536.7 88 544 99.4 544 112L544 528C544 540.6 536.7 552 525.2 557.1C513.7 562.2 500.4 560.3 490.9 552L444.3 511.3C400.7 473.2 345.6 451 287.9 448.3L287.9 544C287.9 561.7 273.6 576 255.9 576L223.9 576C206.2 576 191.9 561.7 191.9 544L191.9 448C121.3 448 64 390.7 64 320C64 249.3 121.3 192 192 192L276.5 192C338.3 191.8 397.9 169.3 444.4 128.7L491 88C500.4 79.7 513.9 77.8 525.3 82.9zM288 384L288 384.2C358.3 386.9 425.8 412.7 480 457.6L480 182.3C425.8 227.2 358.3 253 288 255.7L288 384z"/></svg>'),
        color: '#ef4444'
      }
    ];
  }

  ngOnInit() {
    // Initialize component
  }

  ngAfterViewInit() {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy() {
    // Clean up charts
    if (this.barChart) {
      this.barChart.destroy();
    }
    if (this.donutChart) {
      this.donutChart.destroy();
    }
  }


  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  onModuleClick(module: ModuleCard) {
    console.log('Module clicked:', module.title);
    
    // Navigate to specific pages based on module ID
    switch (module.id) {
      case 'website-management':
        this.router.navigate(['/sites']);
        break;
      case 'manual-audit':
        this.router.navigate(['/audit-manuel']);
        break;
      case 'automatic-audit':
        this.router.navigate(['/audits']);
        break;
      case 'compliance-data':
        this.router.navigate(['/compliance-audit']);
        break;
      case 'organizational-audit':
        this.router.navigate(['/security-audit']);
        break;
      case 'performance-audit':
        this.router.navigate(['/performance-audit']);
        break;
      default:
        console.log('No navigation defined for module:', module.id);
        break;
    }
  }

  private initializeCharts() {
    this.createBarChart();
    this.createDonutChart();
  }

  private createBarChart() {
    if (!this.barChartRef?.nativeElement) return;

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [
           {
             label: 'Audits Manuels',
             data: [45, 52, 38, 67, 73, 89, 94, 87, 92, 78, 85, 91],
             backgroundColor: '#1A73E8',
             borderRadius: 6,
             borderSkipped: false,
           },
           {
             label: 'Audits Automatiques',
             data: [234, 267, 298, 312, 345, 378, 402, 389, 425, 456, 478, 502],
             backgroundColor: '#03A9F4',
             borderRadius: 6,
             borderSkipped: false,
           }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
              display: false
            },
            ticks: {
              color: textColor
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor
            }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }

  private createDonutChart() {
    if (!this.donutChartRef?.nativeElement) return;

    const ctx = this.donutChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['XSS', 'Injection SQL', 'CSRF', 'En-têtes', 'Autres'],
         datasets: [{
           data: [35, 28, 15, 12, 10],
           backgroundColor: [
             '#ef4444',
             '#f59e0b',
             '#03A9F4',
             '#1A73E8',
             '#03A9F4'
           ],
           borderWidth: 0,
           hoverOffset: 8
         }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    };

    this.donutChart = new Chart(ctx, config);
  }

}