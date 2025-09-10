import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'">
      <span class="theme-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="moon-icon">
          <path d="M512 320C512 214 426 128 320 128L320 512C426 512 512 426 512 320zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320z"/>
        </svg>
      </span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--bg-secondary);
    }

    .theme-toggle:hover {
      background-color: var(--bg-tertiary);
      border-color: var(--primary-color);
      transform: scale(1.05);
    }

    .theme-icon {
      font-size: 1.25rem;
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .moon-icon {
      width: 20px;
      height: 20px;
      fill: var(--text-primary);
      transition: fill 0.3s ease;
    }

    .theme-toggle:hover .theme-icon {
      transform: rotate(180deg);
    }

    .theme-toggle:hover .moon-icon {
      fill: var(--primary-color);
    }
  `]
})
export class ThemeSwitcherComponent implements OnInit {
  isDark = false;

  ngOnInit() {
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDark = savedTheme === 'dark';
    } else {
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.applyTheme();
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  private applyTheme() {
    if (this.isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}