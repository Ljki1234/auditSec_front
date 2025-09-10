import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';
import { NotificationBadgeComponent } from '../../shared/components/notification-badge/notification-badge.component';
import { AuthService } from '../services/auth.service';
import { User } from '../models/auth.models';

@Component({
  selector: 'app-layout-principal',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeSwitcherComponent, NotificationBadgeComponent],
  template: `
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [style.width.px]="sidebarWidth()">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="logo-svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            <span class="logo-text" [class.hidden]="sidebarCollapsed()">AuditSec</span>
          </div>
          <button class="sidebar-toggle" (click)="toggleSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="menu-icon">
              <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          <div class="nav-section">
            <div class="nav-title" [class.hidden]="sidebarCollapsed()">Principal</div>
            <a routerLink="/administration" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="chart-icon">
                  <path d="M256 144C256 117.5 277.5 96 304 96L336 96C362.5 96 384 117.5 384 144L384 496C384 522.5 362.5 544 336 544L304 544C277.5 544 256 522.5 256 496L256 144zM64 336C64 309.5 85.5 288 112 288L144 288C170.5 288 192 309.5 192 336L192 496C192 522.5 170.5 544 144 544L112 544C85.5 544 64 522.5 64 496L64 336zM496 160L528 160C554.5 160 576 181.5 576 208L576 496C576 522.5 554.5 544 528 544L496 544C469.5 544 448 522.5 448 496L448 208C448 181.5 469.5 160 496 160z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Tableau de Bord</span>
            </a>
          </div>

          <div class="nav-section">
            <div class="nav-title" [class.hidden]="sidebarCollapsed()">Sites & Audits</div>
            <a routerLink="/sites" routerLinkActive="active" class="nav-link">
              <span class="nav-icon sites-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M415.9 344L225 344C227.9 408.5 242.2 467.9 262.5 511.4C273.9 535.9 286.2 553.2 297.6 563.8C308.8 574.3 316.5 576 320.5 576C324.5 576 332.2 574.3 343.4 563.8C354.8 553.2 367.1 535.8 378.5 511.4C398.8 467.9 413.1 408.5 416 344zM224.9 296L415.8 296C413 231.5 398.7 172.1 378.4 128.6C367 104.2 354.7 86.8 343.3 76.2C332.1 65.7 324.4 64 320.4 64C316.4 64 308.7 65.7 297.5 76.2C286.1 86.8 273.8 104.2 262.4 128.6C242.1 172.1 227.8 231.5 224.9 296zM176.9 296C180.4 210.4 202.5 130.9 234.8 78.7C142.7 111.3 74.9 195.2 65.5 296L176.9 296zM65.5 344C74.9 444.8 142.7 528.7 234.8 561.3C202.5 509.1 180.4 429.6 176.9 344L65.5 344zM463.9 344C460.4 429.6 438.3 509.1 406 561.3C498.1 528.6 565.9 444.8 575.3 344L463.9 344zM575.3 296C565.9 195.2 498.1 111.3 406 78.7C438.3 130.9 460.4 210.4 463.9 296L575.3 296z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Sites</span>
            </a>
            <a routerLink="/audits" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="audits-icon">
                  <path d="M310.6 194.3L243.4 222.5L243.4 107.2L188.7 297.5L243.4 273.3L243.4 403.6L310.6 194.3zM227.4 97.6L226.1 102.3L210.9 155.2C170.6 170.7 142 209.8 142 255.5C142 307.8 176.3 351.4 225.4 361L225.4 414.6C147.5 404.1 90 336.4 90 255.6C90 175.1 149.8 108.4 227.4 97.6zM538.8 544.8C527.6 556 515.7 557.1 510.2 555.3C504.8 553.5 483.1 535.4 449.8 510.9C416.5 486.3 416.2 475.2 406.8 454.2C397.4 433.3 376.4 411.6 349.3 401.8L339.6 387.1C314.9 404 286.6 414 258.3 415.8L260.4 409.2L276.3 359.7C322.8 347.8 357.2 305.7 357.2 255.5C357.2 201 318.8 153.4 261.2 148.4L261.2 96.3C344.4 101.4 410 170.8 410 255.6C410 289.2 398.8 320.3 381 346L395.6 355.6C405.4 382.7 427.1 403.6 448 413C468.9 422.4 480.2 422.7 504.8 456C529.4 489.2 547.5 510.9 549.3 516.3C551.1 521.7 550 533.6 538.8 544.8zM528.9 526.9C528.9 522.5 525.3 518.9 520.9 518.9C516.5 518.9 512.9 522.5 512.9 526.9C512.9 531.3 516.5 534.9 520.9 534.9C525.3 534.9 528.9 531.3 528.9 526.9z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Audits</span>
            </a>
            <a routerLink="/audit-manuel" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="search-icon">
                  <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Audit Manuel</span>
            </a>
            <a routerLink="/infrastructure-audit" routerLinkActive="active" class="nav-link">
              <span class="nav-icon infrastructure-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M256 128C256 110.3 270.3 96 288 96L352 96C369.7 96 384 110.3 384 128L384 192C384 209.7 369.7 224 352 224L344 224L344 288L464 288C503.8 288 536 320.2 536 360L536 416L544 416C561.7 416 576 430.3 576 448L576 512C576 529.7 561.7 544 544 544L480 544C462.3 544 448 529.7 448 512L448 448C448 430.3 462.3 416 480 416L488 416L488 360C488 346.7 477.3 336 464 336L344 336L344 416L352 416C369.7 416 384 430.3 384 448L384 512C384 529.7 369.7 544 352 544L288 544C270.3 544 256 529.7 256 512L256 448C256 430.3 270.3 416 288 416L296 416L296 336L176 336C162.7 336 152 346.7 152 360L152 416L160 416C177.7 416 192 430.3 192 448L192 512C192 529.7 177.7 544 160 544L96 544C78.3 544 64 529.7 64 512L64 448C64 430.3 78.3 416 96 416L104 416L104 360C104 320.2 136.2 288 176 288L296 288L296 224L288 224C270.3 224 256 209.7 256 192L256 128z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Infrastructure & Réseau</span>
            </a>
            <a routerLink="/compliance-audit" routerLinkActive="active" class="nav-link">
              <span class="nav-icon compliance-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="currentColor" d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Conformité & données</span>
            </a>
            <a routerLink="/performance-audit" routerLinkActive="active" class="nav-link">
              <span class="nav-icon performance-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M128 320L156.5 92C158.5 76 172.1 64 188.3 64L356.9 64C371.9 64 384 76.1 384 91.1C384 94.3 383.4 97.6 382.3 100.6L336 224L475.3 224C495.5 224 512 240.4 512 260.7C512 268.1 509.8 275.3 505.6 281.4L313.4 562.4C307.5 571 297.8 576.1 287.5 576.1L284.6 576.1C268.9 576.1 256.1 563.3 256.1 547.6C256.1 545.3 256.4 543 257 540.7L304 352L160 352C142.3 352 128 337.7 128 320z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Performance & disponibilité</span>
            </a>
          </div>

          <div class="nav-section">
            <div class="nav-title" [class.hidden]="sidebarCollapsed()">Communication</div>
            <a routerLink="/security-audit" routerLinkActive="active" class="nav-link">
              <span class="nav-icon security-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="currentColor" d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Organisationnel</span>
            </a>
            <a routerLink="/notifications" routerLinkActive="active" class="nav-link">
              <span class="nav-icon notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="currentColor" d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Notifications</span>
              <app-notification-badge [count]="3"></app-notification-badge>
            </a>
          </div>

          <div class="nav-section">
            <div class="nav-title" [class.hidden]="sidebarCollapsed()">Configuration</div>
            <a routerLink="/user-settings" routerLinkActive="active" class="nav-link">
              <span class="nav-icon settings-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="currentColor" d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
                </svg>
              </span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Paramètres</span>
            </a>
            <a routerLink="/administration" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">👥</span>
              <span class="nav-text" [class.hidden]="sidebarCollapsed()">Administration</span>
            </a>
          </div>
        </nav>
        
        <!-- Resize Handle -->
        <div class="resize-handle" (mousedown)="startResize($event)" *ngIf="!sidebarCollapsed()"></div>
      </aside>

      <!-- Main Content -->
      <div class="main-content" [class.expanded]="sidebarCollapsed()">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="topbar-left">
            <!-- Page title removed -->
          </div>
          <div class="topbar-right">
            <app-theme-switcher></app-theme-switcher>
            <div class="user-menu" *ngIf="isAuthenticated && currentUser">
              <div class="user-avatar">
                <span>{{ getInitials(currentUser.username) }}</span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ currentUser.username }}</span>
                <span class="user-role">{{ getRoleDisplay(currentUser.roles) }}</span>
              </div>
              <div class="user-menu-dropdown">
                <button class="menu-toggle-button" (click)="toggleUserMenu()" title="Menu utilisateur">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="three-dots-icon">
                    <circle cx="12" cy="5" r="2" fill="currentColor"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor"/>
                    <circle cx="12" cy="19" r="2" fill="currentColor"/>
                  </svg>
                </button>
                <div class="dropdown-menu" [class.show]="showUserMenu">
                  <a routerLink="/user-settings" class="dropdown-item" (click)="closeUserMenu()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dropdown-icon">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" fill="currentColor"/>
                    </svg>
                    <span>Paramètres</span>
                  </a>
                  <button class="dropdown-item logout-item" (click)="logout(); closeUserMenu()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dropdown-icon">
                      <path d="M16 17V14H9V10H16V7L21 12L16 17M14 2A2 2 0 0 1 16 4V6H14V4H5V20H14V18H16V20A2 2 0 0 1 14 22H5A2 2 0 0 1 3 20V4A2 2 0 0 1 5 2H14Z" fill="currentColor"/>
                    </svg>
                    <span>Déconnexion</span>
              </button>
                </div>
              </div>
            </div>
            <div class="user-menu" *ngIf="!isAuthenticated">
              <a routerLink="/login" class="login-link">
                <span>🔑</span>
                <span>Se connecter</span>
              </a>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="content">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background-color: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      box-shadow: var(--shadow);
      min-width: 200px;
      max-width: 400px;
      position: relative;
    }

    .sidebar.collapsed {
      width: 64px;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-svg {
      width: 20px;
      height: 20px;
      color: white;
    }

    .logo-text {
      font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-left: 0.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: opacity 0.3s ease;
    }

    .logo-text.hidden {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .sidebar-toggle {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-icon {
      width: 20px;
      height: 20px;
      transition: all 0.2s ease;
    }

    .sidebar-toggle:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .sidebar-toggle:hover .menu-icon {
      transform: scale(1.1);
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 1.5rem;
    }

    .nav-title {
      padding: 0 1rem;
      font-size: 11px; /* Petits détails / footers */
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      transition: opacity 0.3s ease;
    }

    .nav-title.hidden {
      opacity: 0;
      height: 0;
      margin-bottom: 0;
      overflow: hidden;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
      gap: 0.75rem;
    }

    .nav-link:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .nav-link.active {
      background-color: var(--primary-light);
      color: var(--primary-color);
      border-right: 3px solid var(--primary-color);
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 24px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-icon {
      width: 20px;
      height: 20px;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .nav-link:hover .chart-icon {
      fill: var(--text-primary);
    }

    .nav-link.active .chart-icon {
      fill: var(--primary-color);
    }

    .sites-icon {
      width: 20px;
      height: 20px;
    }

    .sites-icon svg {
      width: 100%;
      height: 100%;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .sites-icon:hover svg {
      fill: var(--primary-color);
    }

    .nav-link.active .sites-icon svg {
      fill: var(--primary-color);
    }



    .search-icon {
      width: 20px;
      height: 20px;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .nav-link:hover .search-icon {
      fill: var(--text-primary);
    }

    .nav-link.active .search-icon {
      fill: var(--primary-color);
    }

    .audits-icon {
      width: 20px;
      height: 20px;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .infrastructure-icon {
      width: 20px;
      height: 20px;
    }

    .infrastructure-icon svg {
      width: 100%;
      height: 100%;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .infrastructure-icon:hover svg {
      fill: var(--primary-color);
    }

    .nav-link.active .infrastructure-icon svg {
      fill: var(--primary-color);
    }

    .compliance-icon {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      transition: color 0.3s ease;
    }

    .compliance-icon svg {
      width: 100%;
      height: 100%;
    }

    .compliance-icon:hover {
      color: var(--primary-color);
    }

    .nav-link.active .compliance-icon {
      color: var(--primary-color);
    }

    .performance-icon {
      width: 20px;
      height: 20px;
    }

    .performance-icon svg {
      width: 100%;
      height: 100%;
      fill: var(--text-secondary);
      transition: fill 0.3s ease;
    }

    .performance-icon:hover svg {
      fill: var(--primary-color);
    }

    .nav-link.active .performance-icon svg {
      fill: var(--primary-color);
    }

    .security-icon {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      transition: color 0.3s ease;
    }

    .security-icon svg {
      width: 100%;
      height: 100%;
    }

    .security-icon:hover {
      color: var(--primary-color);
    }

    .nav-link.active .security-icon {
      color: var(--primary-color);
    }

    .settings-icon {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      transition: color 0.3s ease;
    }

    .settings-icon svg {
      width: 100%;
      height: 100%;
    }

    .settings-icon:hover {
      color: var(--primary-color);
    }

    .nav-link.active .settings-icon {
      color: var(--primary-color);
    }

    .notification-icon {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      transition: color 0.3s ease;
    }

    .notification-icon svg {
      width: 100%;
      height: 100%;
    }

    .notification-icon:hover {
      color: var(--primary-color);
    }

    .nav-link.active .notification-icon {
      color: var(--primary-color);
    }

    .nav-link:hover .audits-icon {
      fill: var(--text-primary);
    }

    .nav-link.active .audits-icon {
      fill: var(--primary-color);
    }

    .nav-text {
      font-size: 14px; /* Menu / sidebar */
      font-weight: 500;
      transition: opacity 0.3s ease;
    }

    .nav-text.hidden {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: margin-left 0.3s ease;
    }

    .main-content.expanded {
      margin-left: 0;
    }

    .topbar {
      height: 64px;
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 1.5rem;
      box-shadow: var(--shadow);
    }

    .topbar-left {
      display: flex;
      align-items: center;
    }

    .page-title {
      font-size: 21px; /* Titres principaux (page / dashboard) */
      font-weight: 700;
      color: var(--text-headings);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .user-menu:hover {
      background-color: var(--bg-secondary);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .user-menu-dropdown {
      position: relative;
    }

    .menu-toggle-button {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      min-height: 40px;
    }

    .three-dots-icon {
      width: 20px;
      height: 20px;
      transition: all 0.2s ease;
    }

    .menu-toggle-button:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .menu-toggle-button:hover .three-dots-icon {
      transform: scale(1.1);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      box-shadow: var(--shadow-lg);
      min-width: 180px;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
    }

    .dropdown-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      text-decoration: none;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-size: 0.875rem;
    }

    .dropdown-item:hover {
      background-color: var(--bg-secondary);
    }

    .dropdown-item.logout-item:hover {
      background-color: var(--error-color);
      color: white;
    }

    .dropdown-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .resize-handle {
      position: absolute;
      top: 0;
      right: 0;
      width: 4px;
      height: 100%;
      background: transparent;
      cursor: col-resize;
      z-index: 10;
      transition: background-color 0.2s ease;
    }

    .resize-handle:hover {
      background: var(--primary-color);
    }

    .resize-handle:active {
      background: var(--primary-dark);
    }

    .login-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .login-link:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      background-color: var(--bg-secondary);
    }

    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        z-index: 1000;
        height: 100vh;
        transform: translateX(-100%);
      }

      .sidebar.collapsed {
        transform: translateX(0);
        width: 64px;
      }

      .main-content {
        margin-left: 0;
      }

      .user-info {
        display: none;
      }
    }
  `]
})
export class LayoutPrincipalComponent implements OnInit, OnDestroy {
  sidebarCollapsed = signal(false);
  sidebarWidth = signal(280);
  showUserMenu = false;
  currentUser: User | null = null;
  isAuthenticated = false;
  private destroy$ = new Subject<void>();
  private isResizing = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if mobile and collapse sidebar by default
    if (window.innerWidth <= 768) {
      this.sidebarCollapsed.set(true);
    }

    // Subscribe to auth state changes
    this.authService.authState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentUser = state.user;
        this.isAuthenticated = state.isAuthenticated;
      });

    // Close user menu when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-dropdown')) {
        this.closeUserMenu();
      }
    });

    // Add resize event listeners
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(username: string): string {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRoleDisplay(roles: string[]): string {
    if (roles.includes('ADMIN')) {
      return 'Administrateur';
    }
    return 'Utilisateur';
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  getPageTitle(): string {
    // This would typically come from router data or a service
    const path = window.location.pathname;
    const titles: { [key: string]: string } = {
      '/administration': 'Tableau de Bord',
      '/sites': 'Gestion des Sites',
      '/audits': 'Audits de Sécurité',
      '/audit-manuel': 'Audit de Sécurité Manuel',
      '/performance-audit': 'Performance & disponibilité',
      '/infrastructure-audit': 'Infrastructure & Réseau',
      '/compliance-audit': 'Conformité & données',
      '/security-audit': 'Organisationnel',
      '/notifications': 'Notifications',
      '/user-settings': 'Paramètres',
      '/administration/utilisateurs': 'Administration'
    };
    
    return titles[path] || 'Audit de Sécurité';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  startResize(event: MouseEvent): void {
    if (this.sidebarCollapsed()) return;
    
    event.preventDefault();
    this.isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    
    const newWidth = event.clientX;
    const minWidth = 200;
    const maxWidth = 400;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      this.sidebarWidth.set(newWidth);
    }
  }

  onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }
}