import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AuditQuestion {
  id: string;
  question: string;
  answer: 'yes' | 'no' | 'partial' | '';
  comment: string;
}

interface AuditSection {
  id: string;
  title: string;
  questions: AuditQuestion[];
  uploadedFile: File | null;
}

@Component({
  selector: 'app-security-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-container">
      <div class="header">
        <h1 class="title">
          Audit de Sécurité Organisationnel
        </h1>
      </div>


      <!-- Global Score -->
      <div class="global-score card">
        <h2>Score de Sécurité Global</h2>
        <div class="score-container">
          <div class="score-circle" [style.background]="getScoreColor(globalScore())">
            <span class="score-text">{{ globalScore() }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="globalScore()" [style.background]="getScoreColor(globalScore())"></div>
          </div>
        </div>
      </div>

      <!-- Audit Sections -->
      <div class="sections-container">
        <div *ngFor="let section of auditSections(); let i = index" class="section card">
          <div class="section-header">
            <h3>{{ section.title }}</h3>
            <div class="section-score">
              <span class="score-badge" [style.background]="getScoreColor(getSectionScore(i))">
                {{ getSectionScore(i) }}%
              </span>
            </div>
          </div>

          <div class="progress-bar section-progress">
            <div class="progress-fill" [style.width.%]="getSectionScore(i)" [style.background]="getScoreColor(getSectionScore(i))"></div>
          </div>

          <div class="questions">
            <div *ngFor="let question of section.questions; let j = index" class="question-item">
              <h4>{{ question.question }}</h4>
              
              <div class="answer-options">
                <label class="radio-option yes">
                  <input 
                    type="radio" 
                    [name]="'q_' + i + '_' + j" 
                    value="yes"
                    [(ngModel)]="question.answer"
                  />
                  <span class="radio-custom"></span>
                  Oui
                </label>
                
                <label class="radio-option partial">
                  <input 
                    type="radio" 
                    [name]="'q_' + i + '_' + j" 
                    value="partial"
                    [(ngModel)]="question.answer"
                  />
                  <span class="radio-custom"></span>
                  Partiel
                </label>
                
                <label class="radio-option no">
                  <input 
                    type="radio" 
                    [name]="'q_' + i + '_' + j" 
                    value="no"
                    [(ngModel)]="question.answer"
                  />
                  <span class="radio-custom"></span>
                  Non
                </label>
              </div>

              <div class="comment-section">
                <textarea 
                  [(ngModel)]="question.comment"
                  placeholder="Commentaires supplémentaires (optionnel)"
                  class="comment-input"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- File Upload -->
          <div class="upload-section">
            <h4>Télécharger la Documentation de Support</h4>
            <div class="file-upload">
              <input 
                type="file" 
                [id]="'file_' + i"
                (change)="onFileSelected($event, i)"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                class="file-input"
              />
              <label [for]="'file_' + i" class="file-label">
                <i class="upload-icon">📎</i>
                {{ section.uploadedFile ? section.uploadedFile.name : 'Choisir un fichier ou glisser ici' }}
              </label>
              <div *ngIf="section.uploadedFile" class="file-info">
                <span class="file-size">{{ formatFileSize(section.uploadedFile.size) }}</span>
                <button class="remove-file" (click)="removeFile(i)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="summary card">
        <h2>Résumé de l'Audit</h2>
        <div class="summary-grid">
          <div *ngFor="let section of auditSections(); let i = index" class="summary-item">
            <h4>{{ section.title }}</h4>
            <div class="summary-score" [style.color]="getScoreColor(getSectionScore(i))">
              {{ getSectionScore(i) }}%
            </div>
          </div>
        </div>
        <div class="final-score">
          <h3>Score Final : <span [style.color]="getScoreColor(globalScore())">{{ globalScore() }}%</span></h3>
          <p class="score-description">{{ getScoreDescription(globalScore()) }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .audit-container {
      min-height: 100vh;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      transition: all 0.3s ease;
    }

    .header {
      margin-bottom: 30px;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 0;
      color: var(--text-primary);
    }

    .icon {
      font-size: 3rem;
    }

    .card {
      background: var(--bg-primary);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 25px;
      margin-bottom: 25px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      transition: transform 0.3s ease;
    }

    .card:hover {
      transform: translateY(-2px);
    }

    .global-score h2,
    .summary h2 {
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .global-score .score-container {
      display: flex;
      align-items: center;
      gap: 25px;
    }

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.5rem;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }

    .progress-bar {
      flex: 1;
      height: 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.5s ease;
      border-radius: 6px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .score-badge {
      padding: 8px 16px;
      border-radius: 20px;
      color: white;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .section-progress {
      margin-bottom: 25px;
    }

    .questions {
      margin-bottom: 25px;
    }

    .question-item {
      margin-bottom: 25px;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .question-item h4 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .answer-options {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 10px 15px;
      border-radius: 8px;
      transition: all 0.3s ease;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      color: var(--text-primary);
    }

    .radio-option:hover {
      background: var(--bg-primary);
    }

    .radio-option.yes {
      border-color: #27ae60;
    }

    .radio-option.partial {
      border-color: #f39c12;
    }

    .radio-option.no {
      border-color: #e74c3c;
    }

    .radio-option input[type="radio"] {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border: 2px solid currentColor;
      border-radius: 50%;
      position: relative;
      transition: all 0.3s ease;
    }

    .radio-option input[type="radio"]:checked + .radio-custom::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: currentColor;
      border-radius: 50%;
    }

    .comment-input {
      width: 100%;
      min-height: 80px;
      padding: 12px 16px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary);
      color: var(--text-primary);
      resize: vertical;
      font-family: inherit;
      transition: all 0.3s ease;
    }

    .comment-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 15px var(--primary-light);
    }

    .upload-section h4 {
      margin-bottom: 15px;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .file-upload {
      position: relative;
    }

    .file-input {
      display: none;
    }

    .file-label {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px 20px;
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .file-label:hover {
      border-color: var(--primary-color);
      background: var(--primary-light);
    }

    .upload-icon {
      font-size: 1.2rem;
    }

    .file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding: 10px;
      background: rgba(39, 174, 96, 0.2);
      border-radius: 8px;
      border: 1px solid rgba(39, 174, 96, 0.3);
    }

    .file-size {
      font-size: 0.9rem;
      opacity: 0.8;
      color: var(--text-primary);
    }

    .remove-file {
      background: none;
      border: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.3s ease;
    }

    .remove-file:hover {
      background: rgba(231, 76, 60, 0.2);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 25px;
    }

    .summary-item {
      text-align: center;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .summary-item h4 {
      margin: 0 0 10px 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .summary-score {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .final-score {
      text-align: center;
      padding: 25px;
      background: var(--bg-secondary);
      border-radius: 15px;
      border: 2px solid var(--border-color);
    }

    .final-score h3 {
      margin: 0 0 10px 0;
      font-size: 1.8rem;
      color: var(--text-primary);
    }

    .score-description {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.8;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .audit-container {
        padding: 15px;
      }

      .title {
        font-size: 2rem;
      }

      .global-score .score-container {
        flex-direction: column;
        gap: 15px;
      }

      .answer-options {
        flex-direction: column;
        gap: 10px;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }

    @media (max-width: 480px) {
      .card {
        padding: 20px;
      }

      .title {
        font-size: 1.5rem;
      }

      .icon {
        font-size: 2rem;
      }
    }
  `]
})
export class SecurityAuditComponent {
  auditSections = signal<AuditSection[]>([
    {
      id: 'access-management',
      title: 'Gestion des Accès (Principe du Moindre Privilège)',
      uploadedFile: null,
      questions: [
        {
          id: 'am1',
          question: 'Les contrôles d\'accès utilisateur sont-ils implémentés avec des permissions basées sur les rôles ?',
          answer: '',
          comment: ''
        },
        {
          id: 'am2',
          question: 'L\'authentification multi-facteurs (MFA) est-elle appliquée à tous les comptes utilisateur ?',
          answer: '',
          comment: ''
        },
        {
          id: 'am3',
          question: 'Les droits d\'accès utilisateur sont-ils révisés et mis à jour régulièrement ?',
          answer: '',
          comment: ''
        },
        {
          id: 'am4',
          question: 'Le principe du moindre privilège est-il appliqué à tous les accès système ?',
          answer: '',
          comment: ''
        }
      ]
    },
    {
      id: 'patch-management',
      title: 'Gestion des Correctifs et Mises à Jour',
      uploadedFile: null,
      questions: [
        {
          id: 'pm1',
          question: 'Les correctifs de sécurité sont-ils appliqués aux systèmes et logiciels régulièrement ?',
          answer: '',
          comment: ''
        },
        {
          id: 'pm2',
          question: 'Le scan de vulnérabilités est-il effectué de manière régulière ?',
          answer: '',
          comment: ''
        },
        {
          id: 'pm3',
          question: 'Les correctifs sont-ils testés dans un environnement de développement avant déploiement ?',
          answer: '',
          comment: ''
        },
        {
          id: 'pm4',
          question: 'Y a-t-il un système automatisé de gestion des correctifs en place ?',
          answer: '',
          comment: ''
        }
      ]
    },
    {
      id: 'backup-recovery',
      title: 'Sauvegarde et Récupération d\'Urgence (PRA/PCA)',
      uploadedFile: null,
      questions: [
        {
          id: 'br1',
          question: 'Les sauvegardes régulières sont-elles effectuées et stockées de manière sécurisée hors site ?',
          answer: '',
          comment: ''
        },
        {
          id: 'br2',
          question: 'Les procédures de restauration des sauvegardes sont-elles testées régulièrement ?',
          answer: '',
          comment: ''
        },
        {
          id: 'br3',
          question: 'Y a-t-il un plan de récupération d\'urgence documenté (PRA/PCA) ?',
          answer: '',
          comment: ''
        },
        {
          id: 'br4',
          question: 'Les objectifs de temps de récupération (RTO) et les objectifs de point de récupération (RPO) sont-ils définis ?',
          answer: '',
          comment: ''
        }
      ]
    }
  ]);

  globalScore = computed(() => {
    const sections = this.auditSections();
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
    const totalScore = sections.reduce((sum, section) => {
      return sum + section.questions.reduce((sectionSum, question) => {
        return sectionSum + this.getQuestionScore(question.answer);
      }, 0);
    }, 0);
    
    return totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;
  });

  getSectionScore(sectionIndex: number): number {
    const section = this.auditSections()[sectionIndex];
    const totalQuestions = section.questions.length;
    const totalScore = section.questions.reduce((sum, question) => {
      return sum + this.getQuestionScore(question.answer);
    }, 0);
    
    return totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;
  }

  private getQuestionScore(answer: string): number {
    switch (answer) {
      case 'yes': return 100;
      case 'partial': return 50;
      case 'no': return 0;
      default: return 0;
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#27ae60'; // Green
    if (score >= 60) return '#f39c12'; // Orange
    if (score >= 40) return '#e67e22'; // Dark Orange
    return '#e74c3c'; // Red
  }

  getScoreDescription(score: number): string {
    if (score >= 90) return 'Posture de sécurité excellente';
    if (score >= 80) return 'Bon niveau de sécurité avec des améliorations mineures nécessaires';
    if (score >= 70) return 'Sécurité acceptable avec quelques préoccupations';
    if (score >= 60) return 'Risques de sécurité modérés identifiés';
    if (score >= 50) return 'Améliorations de sécurité significatives requises';
    return 'Vulnérabilités de sécurité critiques présentes';
  }

  onFileSelected(event: Event, sectionIndex: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const sections = this.auditSections();
      sections[sectionIndex].uploadedFile = input.files[0];
      this.auditSections.set([...sections]);
    }
  }

  removeFile(sectionIndex: number) {
    const sections = this.auditSections();
    sections[sectionIndex].uploadedFile = null;
    this.auditSections.set([...sections]);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
