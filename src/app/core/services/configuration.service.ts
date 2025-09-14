import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConfigurationResult {
  component: string;
  version: string;
  status: 'Ok' | 'Warning' | 'Critical';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private http = inject(HttpClient);
  // Utiliser l'URL de l'environnement (proxy en dev, URL directe en prod)
  private baseUrl = environment.apiUrl;

  /**
   * Vérifie la configuration d'un serveur pour une URL donnée
   * @param url L'URL du serveur à analyser
   * @returns Observable contenant la liste des résultats de configuration
   */
  checkConfiguration(url: string): Observable<ConfigurationResult[]> {
    return this.http.get<ConfigurationResult[]>(`${this.baseUrl}/configuration`, {
      params: { url }
    });
  }
}
