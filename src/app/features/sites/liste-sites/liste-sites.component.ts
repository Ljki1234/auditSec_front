import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';

interface Site {
  id: number;
  nom: string;
  url: string;
  statut: 'actif' | 'inactif' | 'erreur';
  dernierAudit: string;
  scoreSecurite: number;
  vulnerabilites: number;
  alertes: number;
  certificatSSL: {
    valide: boolean;
    expiration: string;
  };
  technologies: string[];
}

@Component({
  selector: 'app-liste-sites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="sites-container fade-in">
      <!-- En-tête -->
      <div class="page-header">
        <div class="header-left">
          <h1>Gestion des Sites</h1>
          <p>{{ summary?.total ?? sites.length }} sites surveillés • {{ summary?.active ?? getSitesActifs() }} actifs</p>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="filters-section">
        <div class="search-bar">
          <div class="search-input">
            <span class="search-icon">🔍</span>
            <input type="text" 
                   placeholder="Rechercher un site..." 
                   [(ngModel)]="filtres.recherche"
                   (input)="appliquerFiltres()">
          </div>
        </div>
        
        <div class="filter-controls">
          <select class="filter-select" [(ngModel)]="filtres.statut" (change)="appliquerFiltres()">
            <option value="">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
            <option value="erreur">En erreur</option>
          </select>
          
          <select class="filter-select" [(ngModel)]="filtres.scoreMin" (change)="appliquerFiltres()">
            <option value="">Score minimum</option>
            <option value="80">80+</option>
            <option value="60">60+</option>
            <option value="40">40+</option>
            <option value="20">20+</option>
          </select>

          <button class="btn btn-secondary" (click)="reinitialiserFiltres()">
            <span class="reset-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path fill="currentColor" d="M534.6 182.6C547.1 170.1 547.1 149.8 534.6 137.3L470.6 73.3C461.4 64.1 447.7 61.4 435.7 66.4C423.7 71.4 416 83.1 416 96L416 128L256 128C150 128 64 214 64 320C64 337.7 78.3 352 96 352C113.7 352 128 337.7 128 320C128 249.3 185.3 192 256 192L416 192L416 224C416 236.9 423.8 248.6 435.8 253.6C447.8 258.6 461.5 255.8 470.7 246.7L534.7 182.7zM105.4 457.4C92.9 469.9 92.9 490.2 105.4 502.7L169.4 566.7C178.6 575.9 192.3 578.6 204.3 573.6C216.3 568.6 224 556.9 224 544L224 512L384 512C490 512 576 426 576 320C576 302.3 561.7 288 544 288C526.3 288 512 302.3 512 320C512 390.7 454.7 448 384 448L224 448L224 416C224 403.1 216.2 391.4 204.2 386.4C192.2 381.4 178.5 384.2 169.3 393.3L105.3 457.3z"/>
              </svg>
            </span>
            Réinitialiser
          </button>
        </div>
      </div>

      <!-- Vue en grille/liste -->
      <div class="view-controls">
        <div class="view-toggle">
          <button class="toggle-btn" 
                  [class.active]="vueMode === 'grille'"
                  (click)="vueMode = 'grille'">
            <span>⊞</span>
          </button>
          <button class="toggle-btn" 
                  [class.active]="vueMode === 'liste'"
                  (click)="vueMode = 'liste'">
            <span>☰</span>
          </button>
        </div>
        
        <div class="results-info">
          {{ sitesFiltres.length }} résultat{{ sitesFiltres.length > 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Vue grille -->
      <div class="sites-grid" *ngIf="vueMode === 'grille'">
        <div class="site-card" *ngFor="let site of sitesFiltres; trackBy: trackBySiteId">
          <div class="site-header">
            <div class="site-info">
              <h3 class="site-name">{{ site.nom }}</h3>
              <p class="site-url">{{ site.url }}</p>
            </div>
            <div class="site-status">
              <span class="badge" [class]="'badge-' + getStatusColor(site.statut)">
                {{ getStatusLabel(site.statut) }}
              </span>
            </div>
          </div>

          <div class="site-metrics">
            <div class="metric">
              <div class="metric-label">Score sécurité</div>
              <div class="metric-value" [class]="getScoreClass(site.scoreSecurite)">
                {{ site.scoreSecurite }}%
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Vulnérabilités</div>
              <div class="metric-value" [class]="site.vulnerabilites > 0 ? 'text-danger' : 'text-success'">
                {{ site.vulnerabilites }}
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Alertes</div>
              <div class="metric-value" [class]="site.alertes > 0 ? 'text-warning' : 'text-muted'">
                {{ site.alertes }}
              </div>
            </div>
          </div>

          <div class="site-details">
            <div class="detail-row">
              <span class="detail-label">Dernier audit:</span>
              <span class="detail-value">{{ site.dernierAudit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">SSL:</span>
              <span class="badge" [class]="site.certificatSSL.valide ? 'badge-success' : 'badge-danger'">
                {{ site.certificatSSL.valide ? 'Valide' : 'Expiré' }}
              </span>
            </div>
          </div>

          <div class="site-technologies">
            <span class="tech-tag" *ngFor="let tech of site.technologies.slice(0, 3)">
              {{ tech }}
            </span>
            <span class="tech-more" *ngIf="site.technologies.length > 3">
              +{{ site.technologies.length - 3 }}
            </span>
          </div>

          <div class="site-actions">
            <a [routerLink]="['/sites', site.id]" class="btn btn-secondary btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                <path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/>
              </svg>
              Voir
            </a>
            <button class="btn btn-primary btn-sm" (click)="lancerAudit(site)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
              </svg>
              Auditer
            </button>
            <button class="btn-icon btn-danger" (click)="supprimerSite(site)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Vue liste -->
      <div class="sites-table-container" *ngIf="vueMode === 'liste'">
        <table class="table">
          <thead>
            <tr>
              <th (click)="trierPar('nom')" class="sortable">
                Nom du site
                <span class="sort-indicator" [class]="getSortClass('nom')">↕️</span>
              </th>
              <th>URL</th>
              <th (click)="trierPar('statut')" class="sortable">
                Statut
                <span class="sort-indicator" [class]="getSortClass('statut')">↕️</span>
              </th>
              <th (click)="trierPar('scoreSecurite')" class="sortable">
                Score
                <span class="sort-indicator" [class]="getSortClass('scoreSecurite')">↕️</span>
              </th>
              <th>Vulnérabilités</th>
              <th>SSL</th>
              <th (click)="trierPar('dernierAudit')" class="sortable">
                Dernier audit
                <span class="sort-indicator" [class]="getSortClass('dernierAudit')">↕️</span>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let site of sitesFiltres; trackBy: trackBySiteId">
              <td>
                <div class="site-cell">
                  <strong>{{ site.nom }}</strong>
                  <div class="site-technologies-inline">
                    <span class="tech-tag-small" *ngFor="let tech of site.technologies.slice(0, 2)">
                      {{ tech }}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <a [href]="site.url" target="_blank" class="site-link">
                  {{ site.url }}
                  <span>🔗</span>
                </a>
              </td>
              <td>
                <span class="badge" [class]="'badge-' + getStatusColor(site.statut)">
                  {{ getStatusLabel(site.statut) }}
                </span>
              </td>
              <td>
                <div class="score-cell">
                  <span class="score-value" [class]="getScoreClass(site.scoreSecurite)">
                    {{ site.scoreSecurite }}%
                  </span>
                  <div class="score-bar">
                    <div class="score-fill" 
                         [style.width.%]="site.scoreSecurite"
                         [class]="getScoreClass(site.scoreSecurite)"></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="vulnerability-count" [class]="site.vulnerabilites > 0 ? 'has-vulnerabilities' : ''">
                  {{ site.vulnerabilites }}
                  <span *ngIf="site.alertes > 0" class="alert-indicator">⚠️</span>
                </span>
              </td>
              <td>
                <span class="badge badge-sm" [class]="site.certificatSSL.valide ? 'badge-success' : 'badge-danger'">
                  {{ site.certificatSSL.valide ? 'Valide' : 'Expiré' }}
                </span>
              </td>
              <td>{{ site.dernierAudit }}</td>
              <td>
                <div class="table-actions">
                  <a [routerLink]="['/sites', site.id]" class="btn-icon" title="Voir les détails">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M320 96C239.2 96 174.5 132.8 127.4 176.6C80.6 220.1 49.3 272 34.4 307.7C31.1 315.6 31.1 324.4 34.4 332.3C49.3 368 80.6 420 127.4 463.4C174.5 507.1 239.2 544 320 544C400.8 544 465.5 507.2 512.6 463.4C559.4 419.9 590.7 368 605.6 332.3C608.9 324.4 608.9 315.6 605.6 307.7C590.7 272 559.4 220 512.6 176.6C465.5 132.9 400.8 96 320 96zM176 320C176 240.5 240.5 176 320 176C399.5 176 464 240.5 464 320C464 399.5 399.5 464 320 464C240.5 464 176 399.5 176 320zM320 256C320 291.3 291.3 320 256 320C244.5 320 233.7 317 224.3 311.6C223.3 322.5 224.2 333.7 227.2 344.8C240.9 396 293.6 426.4 344.8 412.7C396 399 426.4 346.3 412.7 295.1C400.5 249.4 357.2 220.3 311.6 224.3C316.9 233.6 320 244.4 320 256z"/>
                    </svg>
                  </a>
                  <button class="btn-icon" (click)="lancerAudit(site)" title="Lancer un audit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 176C258.7 176 248 186.7 248 200L248 248L200 248C186.7 248 176 258.7 176 272C176 285.3 186.7 296 200 296L248 296L248 344C248 357.3 258.7 368 272 368C285.3 368 296 357.3 296 344L296 296L344 296C357.3 296 368 285.3 368 272C368 258.7 357.3 248 344 248L296 248L296 200C296 186.7 285.3 176 272 176z"/>
                    </svg>
                  </button>
                  <button class="btn-icon btn-danger" (click)="supprimerSite(site)" title="Supprimer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
                      <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- État vide -->
      <div class="empty-state" *ngIf="sitesFiltres.length === 0">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path fill="currentColor" d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/>
          </svg>
        </div>
        <h3>Aucun site trouvé</h3>
        <p *ngIf="filtres.recherche || filtres.statut || filtres.scoreMin">
          Aucun site ne correspond à vos critères de recherche.
        </p>
        <p *ngIf="!filtres.recherche && !filtres.statut && !filtres.scoreMin">
          Commencez par ajouter votre premier site à surveiller.
        </p>
        <a routerLink="/sites/ajouter" class="btn btn-primary" *ngIf="sites.length === 0">
          <span>➕</span>
          Ajouter un site
        </a>
        <button class="btn btn-secondary" (click)="reinitialiserFiltres()" *ngIf="sites.length > 0">
          <span class="reset-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path fill="currentColor" d="M534.6 182.6C547.1 170.1 547.1 149.8 534.6 137.3L470.6 73.3C461.4 64.1 447.7 61.4 435.7 66.4C423.7 71.4 416 83.1 416 96L416 128L256 128C150 128 64 214 64 320C64 337.7 78.3 352 96 352C113.7 352 128 337.7 128 320C128 249.3 185.3 192 256 192L416 192L416 224C416 236.9 423.8 248.6 435.8 253.6C447.8 258.6 461.5 255.8 470.7 246.7L534.7 182.7zM105.4 457.4C92.9 469.9 92.9 490.2 105.4 502.7L169.4 566.7C178.6 575.9 192.3 578.6 204.3 573.6C216.3 568.6 224 556.9 224 544L224 512L384 512C490 512 576 426 576 320C576 302.3 561.7 288 544 288C526.3 288 512 302.3 512 320C512 390.7 454.7 448 384 448L224 448L224 416C224 403.1 216.2 391.4 204.2 386.4C192.2 381.4 178.5 384.2 169.3 393.3L105.3 457.3z"/>
            </svg>
          </span>
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sites-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-left h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .header-left p {
      color: var(--text-secondary);
      margin: 0;
    }


    .filters-section {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .search-bar {
      flex: 1;
    }

    .search-input {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .search-input input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .search-input input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .filter-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-size: 0.875rem;
      cursor: pointer;
    }

    .view-controls {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .view-toggle {
      display: flex;
      background-color: var(--bg-primary);
      border-radius: 0.5rem;
      padding: 0.25rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .toggle-btn {
      background: none;
      border: none;
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .toggle-btn:hover {
      background-color: var(--bg-secondary);
    }

    .toggle-btn.active {
      background-color: var(--primary-color);
      color: white;
    }

    .results-info {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    /* Vue grille */
    .sites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .site-card {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .site-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .site-header {
      display: flex;
      justify-content: between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .site-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .site-url {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .site-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .metric {
      text-align: center;
    }

    .metric-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .text-success { color: var(--success-color); }
    .text-warning { color: var(--warning-color); }
    .text-danger { color: var(--error-color); }
    .text-muted { color: var(--text-muted); }

    .site-details {
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .detail-value {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .site-technologies {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .tech-tag {
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
    }

    .tech-more {
      background-color: var(--primary-light);
      color: var(--primary-color);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .site-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-icon {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .btn-icon:hover {
      background-color: var(--bg-secondary);
    }

    .btn-icon.btn-danger {
      border-color: #DC3545;
      color: #DC3545;
    }

    .btn-icon.btn-danger:hover {
      background-color: #DC3545;
      color: white;
    }

    .btn-icon svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
      margin-right: 0.5rem;
    }

    /* Vue liste */
    .sites-table-container {
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th {
      background-color: var(--bg-secondary);
      padding: 1rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
      border-bottom: 1px solid var(--border-color);
    }

    .table th.sortable {
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: background-color 0.2s ease;
    }

    .table th.sortable:hover {
      background-color: var(--bg-tertiary);
    }

    .sort-indicator {
      margin-left: 0.5rem;
      opacity: 0.5;
      font-size: 0.75rem;
    }

    .sort-indicator.asc {
      opacity: 1;
    }

    .sort-indicator.desc {
      opacity: 1;
      transform: rotate(180deg);
    }

    .table td {
      padding: 1rem 0.75rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;
    }

    .site-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .site-technologies-inline {
      display: flex;
      gap: 0.25rem;
    }

    .tech-tag-small {
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.625rem;
      border: 1px solid var(--border-color);
    }

    .site-link {
      color: var(--text-secondary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: color 0.2s ease;
    }

    .site-link:hover {
      color: var(--primary-color);
    }

    .score-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .score-value {
      font-weight: 600;
    }

    .score-bar {
      width: 60px;
      height: 4px;
      background-color: var(--bg-tertiary);
      border-radius: 2px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .score-fill.text-success {
      background-color: var(--success-color);
    }

    .score-fill.text-warning {
      background-color: var(--warning-color);
    }

    .score-fill.text-danger {
      background-color: var(--error-color);
    }

    .vulnerability-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .vulnerability-count.has-vulnerabilities {
      color: var(--error-color);
      font-weight: 600;
    }

    .alert-indicator {
      font-size: 0.75rem;
    }

    .badge-sm {
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
    }

    .table-actions {
      display: flex;
      gap: 0.25rem;
    }

    /* État vide */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background-color: var(--bg-primary);
      border-radius: 0.75rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .empty-icon svg {
      width: 4rem;
      height: 4rem;
      fill: currentColor;
    }

    .reset-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .reset-icon svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    .empty-state h3 {
      color: var(--text-primary);
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin: 0 0 1.5rem 0;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .filters-section {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filter-controls {
        flex-wrap: wrap;
      }

      .view-controls {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .sites-grid {
        grid-template-columns: 1fr;
      }

      .site-metrics {
        grid-template-columns: repeat(2, 1fr);
      }

      .sites-table-container {
        overflow-x: auto;
      }

      .table {
        min-width: 800px;
      }
    }
  `]
})
export class ListeSitesComponent implements OnInit {
  vueMode: 'grille' | 'liste' = 'grille';
  
  filtres = {
    recherche: '',
    statut: '',
    scoreMin: ''
  };

  triActuel = {
    colonne: '',
    direction: 'asc' as 'asc' | 'desc'
  };

  summary: { total?: number; active?: number } | null = null;
  sites: Site[] = [];
  sitesFiltres: Site[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.chargerSummary();
    this.chargerListe();
  }

  trackBySiteId(index: number, site: Site): number {
    return site.id;
  }

  getSitesActifs(): number {
    return this.sites.filter(site => site.statut === 'actif').length;
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'actif': 'Actif',
      'inactif': 'Inactif',
      'erreur': 'Erreur'
    };
    return labels[statut] || statut;
  }

  getStatusColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'actif': 'success',
      'inactif': 'warning',
      'erreur': 'danger'
    };
    return colors[statut] || 'secondary';
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  }

  appliquerFiltres() {
    this.sitesFiltres = this.sites.filter(site => {
      const rechercheMatch = !this.filtres.recherche || 
        site.nom.toLowerCase().includes(this.filtres.recherche.toLowerCase()) ||
        site.url.toLowerCase().includes(this.filtres.recherche.toLowerCase());
      
      const statutMatch = !this.filtres.statut || site.statut === this.filtres.statut;
      
      const scoreMatch = !this.filtres.scoreMin || site.scoreSecurite >= parseInt(this.filtres.scoreMin);
      
      return rechercheMatch && statutMatch && scoreMatch;
    });

    // Réappliquer le tri si nécessaire
    if (this.triActuel.colonne) {
      this.appliquerTri();
    }
  }

  reinitialiserFiltres() {
    this.filtres = {
      recherche: '',
      statut: '',
      scoreMin: ''
    };
    this.appliquerFiltres();
  }

  trierPar(colonne: string) {
    if (this.triActuel.colonne === colonne) {
      this.triActuel.direction = this.triActuel.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.triActuel.colonne = colonne;
      this.triActuel.direction = 'asc';
    }
    this.appliquerTri();
  }

  appliquerTri() {
    this.sitesFiltres.sort((a: any, b: any) => {
      const aVal = a[this.triActuel.colonne];
      const bVal = b[this.triActuel.colonne];
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return this.triActuel.direction === 'desc' ? -comparison : comparison;
    });
  }

  getSortClass(colonne: string): string {
    if (this.triActuel.colonne !== colonne) return '';
    return this.triActuel.direction;
  }

  lancerAudit(site: Site) {
    this.http.get(`/api/audits/launch/${site.id}`).subscribe({
      next: (auditResult: any) => {
        const vulns = auditResult?.vulnerabilitiesCount || 0;
        const alerts = auditResult?.alertsCount || 0;
        alert(`Audit terminé!\nVulnérabilités détectées: ${vulns}\nAlertes non lues: ${alerts}`);
        this.chargerListe();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error || "Erreur lors du lancement de l'audit";
        alert(msg);
      }
    });
  }

  editerSite(site: Site) {
    console.log('Démonstration: Éditer site', site.nom);
  }

  supprimerSite(site: Site) {
    const message = `🗑️ Êtes-vous sûr de vouloir supprimer le site "${site.nom}" ?\n\n⚠️ ATTENTION : Cette action supprimera définitivement :\n• Le site web\n• Tous les audits associés\n• Tous les résultats d'audit\n• Toutes les vulnérabilités détectées\n• Toutes les notifications liées\n\nCette action est irréversible !`;
    
    if (confirm(message)) {
      // Afficher un indicateur de chargement
      const originalText = '🗑️';
      const deleteButton = event?.target as HTMLElement;
      if (deleteButton) {
        deleteButton.innerHTML = '⏳';
        deleteButton.setAttribute('disabled', 'true');
      }
      
      this.http.delete(`/api/websites/${site.id}`).subscribe({
        next: () => {
          // Supprimer le site de la liste locale
          this.sites = this.sites.filter(s => s.id !== site.id);
          this.appliquerFiltres();
          
          // Message de succès détaillé
          const successMsg = `✅ Site "${site.nom}" supprimé avec succès !\n\n🗑️ Supprimé en cascade :\n• Site web\n• ${site.vulnerabilites} vulnérabilités\n• ${site.alertes} notifications\n• Tous les audits associés`;
          alert(successMsg);
          
          // Rafraîchir les données depuis le backend
          this.chargerSummary();
          this.chargerListe();
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error || "Erreur lors de la suppression du site";
          alert(`❌ Erreur de suppression : ${msg}`);
        },
        complete: () => {
          // Restaurer le bouton
          if (deleteButton) {
            deleteButton.innerHTML = originalText;
            deleteButton.removeAttribute('disabled');
          }
        }
      });
    }
  }



  private chargerSummary() {
    this.http.get<any>('/api/websites/summary').subscribe({
      next: (s) => this.summary = s,
      error: () => this.summary = null
    });
  }

  private chargerListe() {
    let params = new HttpParams().set('page', '0').set('size', '50');
    if (this.filtres.recherche) params = params.set('q', this.filtres.recherche);
    if (this.filtres.statut) params = params.set('status', this.mapStatutLabel(this.filtres.statut));
    if (this.filtres.scoreMin) params = params.set('minScore', this.filtres.scoreMin);

    this.http.get<any>('/api/websites/list', { params }).subscribe({
      next: (page) => {
        const items = (page?.content ?? []) as any[];
        this.sites = items.map(it => this.mapItemToViewModel(it));
        this.appliquerFiltres();
      },
      error: () => {
        this.sites = [];
        this.sitesFiltres = [];
      }
    });
  }

  private mapItemToViewModel(item: any): Site {
    const statut = this.mapStatusFromApi(item.status);
    return {
      id: item.id,
      nom: item.name ?? item.url,
      url: item.url,
      statut,
      dernierAudit: item.lastAuditAt ? this.formatDate(item.lastAuditAt) : '-',
      scoreSecurite: item.securityScore ?? 0,
      vulnerabilites: item.vulnerabilitiesCount ?? 0,
      alertes: item.alertsCount ?? 0,
      certificatSSL: { valide: !!item.sslValid, expiration: '-' },
      technologies: item.techStack ?? []
    };
  }

  private mapStatusFromApi(status?: string): 'actif' | 'inactif' | 'erreur' {
    const s = (status || '').toLowerCase();
    if (s === 'actif') return 'actif';
    if (s === 'inactif') return 'inactif';
    if (s === 'erreur') return 'erreur';
    // tolère EN/legacy
    if (s === 'active') return 'actif';
    if (s === 'inactive') return 'inactif';
    if (s === 'error') return 'erreur';
    return 'actif';
  }

  private mapStatutLabel(statut?: string): string {
    if (!statut) return '';
    if (statut === 'actif') return 'Actif';
    if (statut === 'inactif') return 'Inactif';
    if (statut === 'erreur') return 'Erreur';
    return '';
  }

  private formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  private extraireNom(url: string): string {
    try {
      const u = new URL(url);
      return u.hostname;
    } catch {
      return url;
    }
  }
}