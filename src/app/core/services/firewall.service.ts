import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FirewallDetectionResult {
  component: string;
  status: 'Enabled' | 'Disabled' | 'Partial';
  type: string;
  message: string;
  detectedHeaders: {
    [key: string]: string;
  };
  normalStatus: number;
  attackStatus: number;
  normalSnippet: string;
  attackSnippet: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirewallService {
  private http = inject(HttpClient);
  // Utiliser l'URL de l'environnement (proxy en dev, URL directe en prod)
  private baseUrl = environment.apiUrl;

  /**
   * Analyse la configuration du pare-feu et WAF pour une URL donnée
   * @param url L'URL du serveur à analyser
   * @returns Observable contenant les résultats d'analyse du pare-feu
   */
  analyzeFirewall(url: string): Observable<FirewallDetectionResult> {
    return this.http.get<FirewallDetectionResult>(`${this.baseUrl}/firewall/analyze`, {
      params: { url }
    });
  }
}
