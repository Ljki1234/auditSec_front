import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AuditQuestion {
  id: string;
  question: string;
  answer: 'yes' | 'no' | 'partial' | '';
  comment: string;
}

interface AuditSection {
  name: string;
  questions: AuditQuestion[];
  uploadedFile: File | null;
  score: number;
}

@Component({
  selector: 'app-performance-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-container">
      <!-- Header -->
      <div class="header">
        <h1>Audit de Performance & Disponibilité</h1>
      </div>


      <!-- Global Score -->
      <div class="global-score-card">
        <h2>Score Global de l'Audit</h2>
        <div class="score-display">
          <div class="score-circle">
            <span class="score-value">{{ globalScore() }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="globalScore()"></div>
          </div>
        </div>
      </div>

      <!-- Audit Sections -->
      <div class="sections-container">
        <div class="section-card" *ngFor="let section of auditSections; let i = index">
          <div class="section-header">
            <h3>{{ section.name }}</h3>
            <div class="section-score">
              <span class="score-badge">{{ section.score }}%</span>
              <div class="mini-progress">
                <div class="mini-progress-fill" [style.width.%]="section.score"></div>
              </div>
            </div>
          </div>

          <!-- Questions -->
          <div class="questions-list">
            <div class="question-item" *ngFor="let question of section.questions; let j = index">
              <div class="question-text">{{ question.question }}</div>
              
              <div class="answer-options">
                <label class="radio-option">
                  <input
                    type="radio"
                    [name]="'section_' + i + '_question_' + j"
                    value="yes"
                    [(ngModel)]="question.answer"
                    (change)="updateScores()"
                  />
                  <span class="radio-custom yes"></span>
                  Oui
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    [name]="'section_' + i + '_question_' + j"
                    value="partial"
                    [(ngModel)]="question.answer"
                    (change)="updateScores()"
                  />
                  <span class="radio-custom partial"></span>
                  Partiel
                </label>
                <label class="radio-option">
                  <input
                    type="radio"
                    [name]="'section_' + i + '_question_' + j"
                    value="no"
                    [(ngModel)]="question.answer"
                    (change)="updateScores()"
                  />
                  <span class="radio-custom no"></span>
                  Non
                </label>
              </div>

              <textarea
                [(ngModel)]="question.comment"
                placeholder="Commentaires optionnels..."
                class="comment-input"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- File Upload -->
          <div class="file-upload-section">
            <label for="file_{{ i }}" class="file-upload-label">
              📎 Télécharger une Preuve (PDF, Capture d'écran, etc.)
            </label>
            <input
              id="file_{{ i }}"
              type="file"
              (change)="onFileSelected($event, i)"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
              class="file-input"
            />
            <div *ngIf="section.uploadedFile" class="uploaded-file">
              ✅ {{ section.uploadedFile.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Export Button -->
      <div class="export-section">
        <button class="export-btn" (click)="exportResults()">
          📄 Exporter les Résultats de l'Audit
        </button>
      </div>
    </div>
  `,
  styles: [`
    .audit-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    .header {
      margin-bottom: 30px;
      background: var(--bg-primary);
      padding: 20px 30px;
      border-radius: 15px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .header h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 700;
      color: var(--text-primary);
    }


    .global-score-card {
      background: var(--bg-primary);
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      text-align: center;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .global-score-card h2 {
      margin: 0 0 20px 0;
      font-size: 1.8em;
      font-weight: 600;
      color: var(--text-primary);
    }

    .score-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .score-circle::before {
      content: '';
      position: absolute;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: var(--bg-primary);
    }

    .score-value {
      position: relative;
      z-index: 1;
      font-size: 1.8em;
      font-weight: bold;
      color: var(--primary-color);
    }

    .progress-bar {
      flex: 1;
      height: 20px;
      background: var(--bg-secondary);
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color);
      border-radius: 10px;
      transition: width 0.5s ease;
    }

    .sections-container {
      display: grid;
      gap: 30px;
    }

    .section-card {
      background: var(--bg-primary);
      border-radius: 20px;
      padding: 30px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease;
    }

    .section-card:hover {
      transform: translateY(-5px);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid var(--border-color);
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.5em;
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-score {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .score-badge {
      background: var(--primary-color);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 1.1em;
    }

    .mini-progress {
      width: 100px;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }

    .mini-progress-fill {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.5s ease;
    }

    .questions-list {
      margin-bottom: 25px;
    }

    .question-item {
      margin-bottom: 25px;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border-left: 4px solid var(--primary-color);
    }

    .question-text {
      font-weight: 600;
      margin-bottom: 15px;
      font-size: 1.1em;
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
      font-weight: 500;
      padding: 8px 15px;
      border-radius: 20px;
      transition: all 0.3s ease;
      color: var(--text-primary);
    }

    .radio-option:hover {
      background: var(--primary-light);
    }

    .radio-option input[type="radio"] {
      display: none;
    }

    .radio-custom {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #ccc;
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
      border-radius: 50%;
    }

    .radio-custom.yes {
      border-color: #27ae60;
    }

    .radio-option input[type="radio"]:checked + .radio-custom.yes::after {
      background: #27ae60;
    }

    .radio-custom.partial {
      border-color: #f39c12;
    }

    .radio-option input[type="radio"]:checked + .radio-custom.partial::after {
      background: #f39c12;
    }

    .radio-custom.no {
      border-color: #e74c3c;
    }

    .radio-option input[type="radio"]:checked + .radio-custom.no::after {
      background: #e74c3c;
    }

    .comment-input {
      width: 100%;
      padding: 12px;
      border: 2px solid var(--border-color);
      border-radius: 8px;
      resize: vertical;
      font-family: inherit;
      transition: all 0.3s ease;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .comment-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .file-upload-section {
      margin-top: 20px;
      padding: 20px;
      border: 2px dashed var(--primary-color);
      border-radius: 12px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .file-upload-section:hover {
      background: var(--primary-light);
    }

    .file-upload-label {
      display: inline-block;
      padding: 12px 24px;
      background: var(--primary-color);
      color: white;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .file-upload-label:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px var(--primary-light);
    }

    .file-input {
      display: none;
    }

    .uploaded-file {
      margin-top: 10px;
      padding: 8px 16px;
      background: #27ae60;
      color: white;
      border-radius: 20px;
      display: inline-block;
      font-weight: 500;
    }

    .export-section {
      text-align: center;
      margin-top: 40px;
    }

    .export-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 1.2em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .export-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px var(--primary-light);
    }

    @media (max-width: 768px) {
      .audit-container {
        padding: 15px;
      }

      .header {
        padding: 15px 20px;
        flex-direction: column;
        gap: 15px;
      }

      .header h1 {
        font-size: 2em;
      }

      .score-display {
        flex-direction: column;
        gap: 20px;
      }

      .score-circle {
        width: 100px;
        height: 100px;
      }

      .score-circle::before {
        width: 75px;
        height: 75px;
      }

      .answer-options {
        flex-direction: column;
        gap: 10px;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
    }
  `]
})
export class PerformanceAuditComponent {
  auditSections: AuditSection[] = [
    {
      name: 'Test de Charge & Stress',
      score: 0,
      uploadedFile: null,
      questions: [
        { id: 'load_1', question: 'Le site web se charge-t-il complètement en moins de 3 secondes ?', answer: '', comment: '' },
        { id: 'load_2', question: 'Le site web peut-il gérer des utilisateurs simultanés sans dégradation significative des performances ?', answer: '', comment: '' },
        { id: 'load_3', question: 'Toutes les images et ressources sont-elles optimisées pour la livraison web ?', answer: '', comment: '' },
        { id: 'load_4', question: 'Le site web fonctionne-t-il bien dans des conditions de trafic de pointe ?', answer: '', comment: '' }
      ]
    },
    {
      name: 'Surveillance de la Disponibilité',
      score: 0,
      uploadedFile: null,
      questions: [
        { id: 'uptime_1', question: 'Le site web est-il accessible 24h/24 et 7j/7 avec un temps d\'arrêt minimal (<99,9% de disponibilité) ?', answer: '', comment: '' },
        { id: 'uptime_2', question: 'Y a-t-il des systèmes de surveillance en place pour suivre la disponibilité du site web ?', answer: '', comment: '' },
        { id: 'uptime_3', question: 'Y a-t-il un système d\'alerte automatisé pour les incidents de temps d\'arrêt ?', answer: '', comment: '' },
        { id: 'uptime_4', question: 'Des serveurs de sauvegarde ou des services CDN sont-ils configurés pour la basculement ?', answer: '', comment: '' }
      ]
    },
    {
      name: 'Protection DDoS',
      score: 0,
      uploadedFile: null,
      questions: [
        { id: 'ddos_1', question: 'Y a-t-il un service de protection DDoS actif implémenté ?', answer: '', comment: '' },
        { id: 'ddos_2', question: 'Le site web peut-il résister aux pics de trafic et aux attaques malveillantes ?', answer: '', comment: '' },
        { id: 'ddos_3', question: 'Des mécanismes de limitation de débit et de filtrage des requêtes sont-ils en place ?', answer: '', comment: '' },
        { id: 'ddos_4', question: 'Y a-t-il un plan de réponse aux incidents pour les attaques de sécurité ?', answer: '', comment: '' }
      ]
    }
  ];

  constructor() {
    this.updateScores();
  }

  updateScores() {
    this.auditSections.forEach(section => {
      let totalScore = 0;
      let answeredQuestions = 0;
      
      section.questions.forEach(question => {
        if (question.answer) {
          answeredQuestions++;
          switch (question.answer) {
            case 'yes':
              totalScore += 100;
              break;
            case 'partial':
              totalScore += 50;
              break;
            case 'no':
              totalScore += 0;
              break;
          }
        }
      });
      
      section.score = answeredQuestions > 0 ? Math.round(totalScore / answeredQuestions) : 0;
    });
  }

  globalScore() {
    const totalSections = this.auditSections.length;
    const totalScore = this.auditSections.reduce((sum, section) => sum + section.score, 0);
    return Math.round(totalScore / totalSections);
  }

  onFileSelected(event: any, sectionIndex: number) {
    const file = event.target.files[0];
    if (file) {
      this.auditSections[sectionIndex].uploadedFile = file;
    }
  }

  exportResults() {
    const results = {
      auditDate: new Date().toISOString(),
      globalScore: this.globalScore(),
      sections: this.auditSections.map(section => ({
        name: section.name,
        score: section.score,
        questions: section.questions.map(q => ({
          question: q.question,
          answer: q.answer,
          comment: q.comment
        })),
        hasUploadedFile: !!section.uploadedFile
      }))
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
