import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NmapScanRequest {
  url: string;
  ports?: string;
}

export interface NmapPort {
  '@portid': string;
  '@protocol': string;
  state: {
    '@state': string;
  };
  service: {
    '@name': string;
    '@product'?: string;
  };
}

export interface NmapHost {
  '@starttime': string;
  '@endtime': string;
  status: {
    '@state': string;
  };
  address: {
    '@addr': string;
    '@addrtype': string;
  };
  ports: {
    port: NmapPort[];
  };
}

export interface NmapScanResult {
  '@version': string;
  '@xmloutputversion': string;
  scaninfo: {
    '@type': string;
    '@protocol': string;
  };
  host: NmapHost;
}

@Injectable({
  providedIn: 'root'
})
export class NmapService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/nmap';

  /**
   * Lance un scan nmap sur l'URL spécifiée
   * @param request - L'objet contenant l'URL et optionnellement les ports à scanner
   * @returns Observable contenant les résultats du scan
   */
  scanUrl(request: NmapScanRequest): Observable<NmapScanResult> {
    return this.http.post<NmapScanResult>(`${this.baseUrl}/scan`, request);
  }

  /**
   * Lance un scan nmap avec des ports par défaut (1-1024)
   * @param url - L'URL à scanner
   * @returns Observable contenant les résultats du scan
   */
  scanUrlWithDefaultPorts(url: string): Observable<NmapScanResult> {
    return this.scanUrl({ url, ports: '1-1024' });
  }

  /**
   * Lance un scan nmap avec des ports spécifiques
   * @param url - L'URL à scanner
   * @param ports - Les ports à scanner (ex: "80,443,22" ou "1-1000")
   * @returns Observable contenant les résultats du scan
   */
  scanUrlWithCustomPorts(url: string, ports: string): Observable<NmapScanResult> {
    return this.scanUrl({ url, ports });
  }
}
